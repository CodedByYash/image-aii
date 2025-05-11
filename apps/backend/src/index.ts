console.log("Starting backend server...");
import express from "express";
import { fal } from "@fal-ai/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import cors from "cors";
import { randomUUID } from "crypto";

import {
  TrainModel,
  GenerateImage,
  GenerateImagesFromPack,
} from "common/types";

import { FalAIModel } from "./models/FalAiModel";
import prisma from "@repo/db";

const app = express();
app.use(express.json());
app.use(cors());

dotenv.config();

const falAiModel = new FalAIModel();

const REGION = process.env.AWS_REGION!;
const PORT = process.env.PORT || 8080;
const UserId = "123";

app.get("/pre-signed-url", async (req, res) => {
  console.log("hi");
  const s3 = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  const fileName = `${Date.now()}_${randomUUID()}.zip`;
  const bucketName = process.env.AWS_BUCKET_NAME!;
  const key = `uploads/${fileName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    res.json({ url, key });
  } catch (err) {
    console.error("Error generating presigned URL:", err);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
});

app.post("/ai/training", async (req, res) => {
  const parsedBody = TrainModel.safeParse(req.body);
  const images = req.body.images;
  if (!parsedBody.success) {
    res
      .status(400)
      .json({ message: "Invalid request body", error: parsedBody.error });
    return;
  }

  const { request_id, response_url } = await falAiModel.trainModel(
    parsedBody.data.zipUrl,
    parsedBody.data.name
  );

  const data = await prisma.model.create({
    data: {
      name: parsedBody.data.name,
      type: parsedBody.data.type,
      age: parsedBody.data.age,
      ethinicity: parsedBody.data.ethinicity,
      eyeColor: parsedBody.data.eyeColor,
      bald: parsedBody.data.bald,
      userId: UserId,
      falAiRequestId: request_id,
      zipUrl: parsedBody.data.zipUrl,
    },
  });

  res
    .status(200)
    .json({ message: "Model created successfully", modelId: data.id });
});

app.post("/ai/generate", async (req, res) => {
  const parsedBody = GenerateImage.safeParse(req.body);
  if (!parsedBody.success) {
    res
      .status(400)
      .json({ message: "Invalid request body", error: parsedBody.error });
    return;
  }

  const model = await prisma.model.findUnique({
    where: {
      id: parsedBody.data.modelId,
    },
    select: {
      tensorPath: true,
    },
  });

  if (!model || !model.tensorPath) {
    res.status(400).json({ message: "Model not found" });
    return;
  }

  const { request_id, response_url } = await falAiModel.generateImage(
    parsedBody.data.prompt,
    model.tensorPath
  );
  const data = await prisma.outputImages.create({
    data: {
      prompt: parsedBody.data.prompt,
      modelId: parsedBody.data.modelId,
      userId: UserId,
      imageUrl: "",
      falAiRequestId: request_id,
    },
  });

  res
    .status(200)
    .json({ message: "Image generated successfully", imageId: data.id });
});

app.post("/pack/generate", async (req, res) => {
  const parsedBody = GenerateImagesFromPack.safeParse(req.body);
  if (!parsedBody.success) {
    res
      .status(400)
      .json({ message: "Invalid request body", error: parsedBody.error });
    return;
  }

  const prompts = await prisma.packPrompts.findMany({
    where: {
      packId: parsedBody.data.packId,
    },
  });

  const model = await prisma.model.findFirst({
    where: {
      id: parsedBody.data.modelId,
    },
  });

  if (!model) {
    res.status(411).json({
      message: "Model not found",
    });
    return;
  }

  const tensorPath = model.tensorPath;
  if (!tensorPath) {
    res.status(400).json({ message: "Model tensor path not found" });
    return;
  }

  const requestIds: { request_id: string }[] = await Promise.all(
    prompts.map((prompt: { prompt: string }) =>
      falAiModel.generateImage(prompt.prompt, tensorPath)
    )
  );

  const images = await prisma.outputImages.createManyAndReturn({
    data: prompts.map((prompt: { prompt: string }, index: number) => ({
      prompt: prompt.prompt,
      modelId: parsedBody.data.modelId,
      userId: UserId,
      imageUrl: "",
      falAiRequestId: requestIds[index]!.request_id,
    })),
  });

  res.status(200).json({
    message: "Images generated successfully",
    images: images.map((image: { id: string }) => image.id),
  });
});

app.get("/pack/bulk", async (req, res) => {
  const packs = await prisma.packs.findMany({});

  res.status(200).json({
    message: "Packs fetched successfully",
    packs,
  });
});

app.get("/image/bulk", async (req, res) => {
  const ids = req.query.ids as string[];
  const limit = (req.query.limit as string) ?? "10";
  const offset = (req.query.offset as string) ?? "0";

  const imageData = await prisma.outputImages.findMany({
    where: {
      id: { in: ids },
      userId: UserId,
    },
    skip: parseInt(offset),
    take: parseInt(limit),
  });

  res.status(200).json({
    message: "Images fetched successfully",
    images: imageData,
  });
});

app.post("/fal-ai/webhook/train", async (req, res) => {
  console.log(req.body);

  const requestId = req.body.request_id;

  await prisma.model.updateMany({
    where: {
      falAiRequestId: requestId,
    },
    data: {
      trainingStatus: "Generated",
      tensorPath: req.body.tensor_path,
    },
  });
  res.status(200).json({ message: "Webhook received" });
});

app.post("/fal-ai/webhook/image", async (req, res) => {
  console.log(req.body);

  const requestId = req.body.request_id;

  await prisma.outputImages.updateMany({
    where: {
      falAiRequestId: requestId,
    },
    data: {
      status: "Generated",
      imageUrl: req.body.image_url,
    },
  });
  res.status(200).json({ message: "Webhook received" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
