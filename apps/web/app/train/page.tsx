"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UploadModal } from "@/components/ui/upload";
import { TrainModelInput } from "common/inferred";
import axios from "axios";
import { BACKEND_URL } from "app/config";
import { useAuth } from "@clerk/nextjs";

export default function Train() {
  const [zipUrl, setZipUrl] = useState("");
  const [type, setType] = useState<"Man" | "Woman" | "Others">("Man");
  const [age, setAge] = useState<string>();
  const [ethinicity, setEthinicity] = useState<
    | "White"
    | "Black"
    | "Asian_American"
    | "East_Asian"
    | "South_East_Asian"
    | "South_Asian"
    | "Middle_Eastern"
    | "Pacific"
    | "Hispanic"
  >();
  const [eyeColor, setEyeColor] = useState<
    "Brown" | "Blue" | "Hazel" | "Gray"
  >();
  const [bald, setBald] = useState(false);
  const [name, setName] = useState("");
  const router = useRouter();
  const { getToken } = useAuth();

  async function trainModel() {
    const input: TrainModelInput = {
      zipUrl,
      type,
      age: parseInt(age ?? "0"),
      ethinicity: ethinicity ?? "White",
      eyeColor: eyeColor ?? "Brown",
      bald,
      name,
    };
    const token = await getToken();
    const response = await axios.post(`${BACKEND_URL}/ai/training`, input, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    router.push("/");
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center py-12 px-2">
      <Card className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-gray-200 bg-white/90">
        <CardHeader className="mb-2">
          <CardTitle className="text-3xl font-extrabold text-center text-gray-800 mb-1">
            Create Project
          </CardTitle>
          <CardDescription className="text-center text-gray-500 mb-4">
            Deploy your new project in one-click.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-6">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Name of the model"
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(value: "Man" | "Woman" | "Others") =>
                  setType(value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Man">Man</SelectItem>
                  <SelectItem value="Woman">Woman</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                placeholder="Enter your age"
                onChange={(e) => {
                  setAge(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="ethenicity">Ethnicity</Label>
              <Select
                value={ethinicity}
                onValueChange={(
                  value:
                    | "White"
                    | "Black"
                    | "Asian_American"
                    | "East_Asian"
                    | "South_East_Asian"
                    | "South_Asian"
                    | "Middle_Eastern"
                    | "Pacific"
                    | "Hispanic"
                ) => setEthinicity(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="White">White</SelectItem>
                  <SelectItem value="Black">Black</SelectItem>
                  <SelectItem value="Asian_American">Asian American</SelectItem>
                  <SelectItem value="East_Asian">East Asian</SelectItem>
                  <SelectItem value="South_East_Asian">
                    South East Asian
                  </SelectItem>
                  <SelectItem value="South_Asian">South Asian</SelectItem>
                  <SelectItem value="Middle_Eastern">Middle Eastern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="eye">Eye Color</Label>
              <Select
                value={eyeColor}
                onValueChange={(value: "Brown" | "Blue" | "Hazel" | "Gray") =>
                  setEyeColor(value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Brown">Brown</SelectItem>
                  <SelectItem value="Blue">Blue</SelectItem>
                  <SelectItem value="Hazel">Hazel</SelectItem>
                  <SelectItem value="Gray">Gray</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="bald">Bald</Label>
              <Switch
                id="bald"
                onClick={(e) => {
                  setBald(!bald);
                }}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <UploadModal
                onUploadDone={(zipUrl) => {
                  setZipUrl(zipUrl);
                }}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => {
              router.push("/");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => trainModel()}
            disabled={
              !zipUrl || !type || !age || !ethinicity || !eyeColor || !bald
            }
          >
            Create Model
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
