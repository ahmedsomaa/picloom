import { toast } from "sonner";
import React, { useState } from "react";
import { ScalingIcon } from "lucide-react";

import {
  Card,
  CardTitle,
  CardFooter,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { toBase64 } from "@/lib/files";
import Dropzone from "@/components/Dropzone";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Base64 = string;
type Dimension = {
  width: string;
  height: string;
};

export default function Resizer() {
  const [loading, setLoading] = useState(false);
  const [dimensions, setDimensions] = useState<Dimension>({
    width: "",
    height: "",
  });
  const [resizedImage, setResizedImage] = useState<Base64 | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // --- handlers
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedImage) return;
    const file = event.target.files && event.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (selectedImage) return;
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (selectedImage) return;

    event.preventDefault();
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleOnDelete = () => onReset();

  const onReset = () => {
    setResizedImage(null);
    setSelectedImage(null);
    setDimensions({ height: "", width: "" });
  };

  const onResize = async () => {
    try {
      setLoading(true);
      const img = await toBase64(selectedImage as File);
      const req = await fetch("/api/resize", {
        method: "POST",
        body: JSON.stringify({
          dimensions,
          image: { base64: img, type: selectedImage?.type },
        }),
      });
      if (req.status === 413) {
        throw new Error("Image size exceeded 1MB");
      }
      const res = await req.json();
      setLoading(false);
      setResizedImage(res.data.img);
    } catch (error) {
      setLoading(false);
      const cause = (error as Error).message;
      toast.error("Image Resize Failed", {
        description: cause,
      });
    }
  };

  return (
    <div className="mb-40">
      <section className="relative h-[350px] w-full px-4 md:h-[605px] md:px-6 lg:px-8 xl:px-10 2xl:px-0">
        <div className="flex h-full max-w-screen-md	 mx-auto w-full flex-col items-center gap-5">
          <h2 className="sm:text-4xl/ text-3xl max-w-[708px] font-bold text-slate-900">
            <p className="flex flex-row items-center">
              <ScalingIcon size={32} className="mr-2" />
              Image Resizer
            </p>
          </h2>
          <h3 className="text-xl text-zinc-500">
            Quickly change the dimensions of your images.
          </h3>
          <Card className="w-full flex flex-col gap-2 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Upload your image
              </CardTitle>
              <CardDescription className="text-sm font-medium text-gray-500">
                Only PNG, JPG, JPEG and WEBP are supported
              </CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Dropzone
                  onDrop={handleDrop}
                  onDelete={handleOnDelete}
                  onDragOver={handleDragOver}
                  onChange={handleFileChange}
                  uploadedImage={selectedImage}
                />
              </div>
              <div className="flex flex-col justify-start gap-3">
                <div>
                  <Label htmlFor="height">New Height</Label>
                  <Input
                    id="height"
                    type="text"
                    name="height"
                    inputMode="numeric"
                    disabled={!selectedImage}
                    value={dimensions.height}
                    placeholder="Enter new height..."
                    onChange={({ target }) =>
                      setDimensions((prev) => ({
                        ...prev,
                        height: target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="height">New Width</Label>
                  <Input
                    id="width"
                    type="text"
                    name="width"
                    inputMode="numeric"
                    value={dimensions.width}
                    disabled={!selectedImage}
                    placeholder="Enter new width..."
                    onChange={({ target }) =>
                      setDimensions((prev) => ({
                        ...prev,
                        width: target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
            {selectedImage && <Separator orientation="horizontal" />}
            {selectedImage && (
              <CardFooter className="flex flex-row justify-end">
                {resizedImage ? (
                  <div className="space-x-2">
                    <Button variant="outline" onClick={onReset}>
                      Reset
                    </Button>
                    <a href={resizedImage} download>
                      <Button>Download</Button>
                    </a>
                  </div>
                ) : (
                  <Button disabled={loading} onClick={onResize}>
                    {loading ? "Resizing..." : "Resize"}
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
