import type { z } from "zod";
import { TrainModel, GenerateImage, GenerateImagesFromPack } from "./types";

export type TrainModelInput = z.infer<typeof TrainModel>;
export type GenerateImagelInput = z.infer<typeof GenerateImage>;
export type GenerateImagesFromPackInput = z.infer<
  typeof GenerateImagesFromPack
>;
