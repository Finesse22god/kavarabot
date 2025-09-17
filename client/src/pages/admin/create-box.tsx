import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminCreateBox() {
  const [boxData, setBoxData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    imageUrl: "",
    contents: "",
    availableSizes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating box:", boxData);
    // TODO: Implement box creation logic
  };

  const handleInputChange = (field: string, value: string) => {
    setBoxData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Создать новый бокс</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Название бокса</Label>
                  <Input
                    id="name"
                    value={boxData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Категория</Label>
                  <Select value={boxData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ready">Готовый бокс</SelectItem>
                      <SelectItem value="personal">Персональный бокс</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={boxData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Цена (₽)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={boxData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="originalPrice">Старая цена (₽)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={boxData.originalPrice}
                    onChange={(e) => handleInputChange("originalPrice", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">URL изображения</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={boxData.imageUrl}
                  onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="contents">Содержимое (через запятую)</Label>
                <Input
                  id="contents"
                  value={boxData.contents}
                  onChange={(e) => handleInputChange("contents", e.target.value)}
                  placeholder="Футболка, шорты, кроссовки"
                />
              </div>

              <div>
                <Label htmlFor="availableSizes">Доступные размеры (через запятую)</Label>
                <Input
                  id="availableSizes"
                  value={boxData.availableSizes}
                  onChange={(e) => handleInputChange("availableSizes", e.target.value)}
                  placeholder="S, M, L, XL"
                />
              </div>

              <Button type="submit" className="w-full">
                Создать бокс
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}