import * as React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import type { AccessibilityLevel, DisabilityType, LocationCategory, ProblemType } from "@domain/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  selectedCoords?: { latitude: number; longitude: number };
  onRequestMapSelect?: () => void;
  initial?: {
    id?: string;
    title?: string;
    description?: string;
    level?: AccessibilityLevel;
    category?: LocationCategory;
    problemType?: ProblemType;
    disabilities?: DisabilityType[];
    problemOtherText?: string;
  };
  onDelete?: () => void;
}

// Comentário de Acessibilidade geral:
// - Todos os inputs possuem rótulos associados via htmlFor/aria-labelledby
// - Tamanho mínimo de alvo de toque de 44px
// - Foco visível consistente (anéis azuis)
// - Texto de ajuda para tecnologias assistivas (aria-describedby)
export function AddOccurrenceForm({
  open,
  onOpenChange,
  onSubmit,
  selectedCoords,
  onRequestMapSelect,
  initial,
  onDelete,
}: Props) {
  const [level, setLevel] = React.useState<AccessibilityLevel>(
    initial?.level ?? "amarelo"
  );
  const [disabilities, setDisabilities] = React.useState<DisabilityType[]>(
    initial?.disabilities ?? ["motora"]
  );
  const [category, setCategory] = React.useState<LocationCategory>(
    initial?.category ?? "calcadas"
  );
  const [problem, setProblem] = React.useState<ProblemType>(
    initial?.problemType ?? "calcada_quebrada"
  );
  const [photo, setPhoto] = React.useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>();
  const [photoName, setPhotoName] = React.useState<string | undefined>();

  React.useEffect(() => {
    // Atualiza estados quando mudar item inicial
    if (initial) {
      setLevel(initial.level ?? "amarelo");
      setDisabilities(initial.disabilities ?? ["motora"]);
      setCategory(initial.category ?? "calcadas");
      setProblem(initial.problemType ?? "calcada_quebrada");
    }
  }, [initial]);

  async function compressImage(file: File): Promise<File> {
    try {
      const bitmap = await createImageBitmap(file);
      const maxDim = 1280;
      const ratio = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const w = Math.round(bitmap.width * ratio);
      const h = Math.round(bitmap.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8)
      );
      if (!blob) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
      });
    } catch {
      return file;
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (photo) formData.append("photo", photo);
    onSubmit(formData);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div
          className="space-y-6"
          role="form"
          aria-labelledby="form-title"
          aria-describedby="form-desc"
        >
          <div>
            <h2 id="form-title" className="text-xl font-bold">
              Adicionar ocorrência
            </h2>
            {/* Comentário de Acessibilidade: descrição auxilia leitores de tela */}
            <p id="form-desc" className="text-neutral-700">
              Informe o problema e o nível de acessibilidade observado.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {initial?.id && (
              <input type="hidden" name="id" value={initial.id} />
            )}
            {selectedCoords && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-md border border-neutral-300 bg-neutral-100 p-3 text-sm text-neutral-900"
              >
                Local selecionado: lat {selectedCoords.latitude.toFixed(5)}, lng{" "}
                {selectedCoords.longitude.toFixed(5)}
              </div>
            )}

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-center"
                onClick={() => {
                  onRequestMapSelect?.();
                  onOpenChange(false);
                }}
                aria-describedby="select-help"
              >
                Selecionar localização no mapa
              </Button>
              <p id="select-help" className="text-xs text-neutral-700">
                Após tocar no botão, toque no mapa para marcar o local.
              </p>
            </div>

            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex.: Calçada quebrada"
                required
                aria-required="true"
                defaultValue={initial?.title}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                placeholder="Detalhe o obstáculo"
                defaultValue={initial?.description}
              />
            </div>

            <div>
              <Label>Classificação de acessibilidade</Label>
              <div
                role="radiogroup"
                aria-label="Classificação de acessibilidade"
                className="mt-2 grid grid-cols-1 gap-2"
              >
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="level_radio"
                    className="h-5 w-5"
                    checked={level === 'verde'}
                    onChange={() => setLevel('verde')}
                  />
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: '#137B39' }} aria-hidden="true"></span>
                    Verde — Acessível
                  </span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="level_radio"
                    className="h-5 w-5"
                    checked={level === 'amarelo'}
                    onChange={() => setLevel('amarelo')}
                  />
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: '#8A7000' }} aria-hidden="true"></span>
                    Amarelo — Parcial
                  </span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="level_radio"
                    className="h-5 w-5"
                    checked={level === 'vermelho'}
                    onChange={() => setLevel('vermelho')}
                  />
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: '#A61222' }} aria-hidden="true"></span>
                    Vermelho — Inacessível
                  </span>
                </label>
              </div>
              <input type="hidden" name="level" value={level} />
            </div>

            <div>
              <Label>Categoria do local</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as LocationCategory)}>
                <SelectTrigger aria-label="Selecionar categoria do local">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calcadas">Calçadas</SelectItem>
                  <SelectItem value="edificios_publicos">Edifícios públicos</SelectItem>
                  <SelectItem value="meios_transporte">Meios de transporte</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="category" value={category} />
            </div>

            <div>
              <Label>Tipo de problema</Label>
              <Select value={problem} onValueChange={(v) => setProblem(v as ProblemType)}>
                <SelectTrigger aria-label="Selecionar tipo de problema">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    category === "calcadas"
                      ? [
                          { value: "calcada_quebrada", label: "Calçada quebrada" },
                          { value: "buraco", label: "Buraco" },
                          { value: "desnivel", label: "Desnível" },
                          { value: "obstaculo", label: "Obstáculo na passagem" },
                        ]
                      : category === "edificios_publicos"
                      ? [
                          { value: "falta_rampa", label: "Falta de rampa" },
                          { value: "rampa_inadequada", label: "Rampa inadequada" },
                          { value: "acesso_bloqueado", label: "Acesso bloqueado" },
                          { value: "banheiro_inacessivel", label: "Banheiro inacessível" },
                        ]
                      : [
                          { value: "ponto_sem_rampa", label: "Ponto sem rampa" },
                          { value: "onibus_sem_elevador", label: "Ônibus sem elevador" },
                          { value: "estacao_sem_acesso", label: "Estação sem acesso" },
                        ]
                  ).concat([{ value: "outro", label: "Outro" }]).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value as ProblemType}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="problemType" value={problem} />
            </div>

            {problem === "outro" && (
              <div>
                <Label htmlFor="problemOther">Descreva o problema</Label>
                <Input
                  id="problemOther"
                  name="problemOther"
                  placeholder="Descreva o problema"
                  defaultValue={initial?.problemOtherText}
                />
              </div>
            )}

            <div>
              <Label>Tipo de deficiência</Label>
              {/* Comentário de Acessibilidade: multiselect substituído por checkboxes para melhor navegabilidade por teclado */}
              <div
                className="grid grid-cols-2 gap-3"
                role="group"
                aria-label="Tipo de deficiência"
              >
                {(
                  [
                    "motora",
                    "visual",
                    "auditiva",
                    "multipla",
                  ] as DisabilityType[]
                ).map((d) => (
                  <label key={d} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      checked={disabilities.includes(d)}
                      onChange={(e) => {
                        setDisabilities((prev) =>
                          e.target.checked
                            ? [...prev, d]
                            : prev.filter((x) => x !== d)
                        );
                      }}
                    />
                    <span className="text-neutral-900 capitalize">{d}</span>
                  </label>
                ))}
              </div>
              <input
                type="hidden"
                name="disabilities"
                value={disabilities.join(",")}
              />
            </div>

            <div>
              <Label>Foto do local</Label>
              <Input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const compressed = await compressImage(f);
                    setPhoto(compressed);
                    setPreviewUrl(URL.createObjectURL(compressed));
                    setPhotoName(compressed.name);
                  } else {
                    setPhoto(undefined);
                    setPreviewUrl(undefined);
                    setPhotoName(undefined);
                  }
                }}
              />
              <div
                className="mt-2 flex min-h-[160px] cursor-pointer items-center justify-center rounded-md border border-neutral-300 bg-neutral-50 p-4"
                role="button"
                aria-label="Selecionar foto do local"
                onClick={() => document.getElementById("photo")?.click()}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Pré-visualização da foto do local"
                    className="max-h-48 w-auto"
                  />
                ) : (
                  <span className="text-neutral-700">Toque para selecionar a foto</span>
                )}
              </div>
                  {photoName && (
                    <p className="mt-1 max-w-full break-words px-2 text-center text-sm text-neutral-700">{photoName}</p>
                  )}
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-12 w-full justify-center">
                  Cancelar
                </Button>
              </DialogClose>
              {onDelete && initial?.id && (
                <Button type="button" variant="outline" onClick={onDelete} className="h-12 w-full justify-center">
                  Excluir
                </Button>
              )}
              <Button type="submit" variant="primary" className="h-12 w-full justify-center">
                Salvar ocorrência
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
