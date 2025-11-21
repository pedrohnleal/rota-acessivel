import * as React from "react";
import mapboxgl from "mapbox-gl";
import maplibregl from "maplibre-gl";
import type {
  Occurrence,
  AccessibilityLevel,
  DisabilityType,
  LocationCategory,
  Evaluation,
} from "@domain/types";
import { initialOccurrences } from "@application/sampleData";
import {
  saveOccurrence,
  loadOccurrences,
  deleteOccurrence,
} from "@infrastructure/storage/indexedDb";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { AddOccurrenceForm } from "../components/AddOccurrenceForm";
import { RoutePlanner } from "../components/RoutePlanner";
import { Dialog, DialogTrigger, DialogContent } from "../components/ui/dialog";
// import { Sheet, SheetContent } from "../components/ui/sheet";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Info,
  Send,
  Filter,
  BarChart2,
  LogOut,
  Map,
  Star,
  Route,
} from "lucide-react";

// Comentário de Acessibilidade geral da tela:
// - Usa cores e ícones combinados com texto (não depende somente da cor)
// - Foco visível em controles interativos
// - Botão flutuante com aria-label
// - Componentes de seleção com rótulos
export default function Home() {
  const [map, setMap] = React.useState<mapboxgl.Map | maplibregl.Map | null>(
    null
  );
  const [markers, setMarkers] = React.useState<any[]>([]);
  const [occurrences, setOccurrences] =
    React.useState<Occurrence[]>(initialOccurrences);
  const [openForm, setOpenForm] = React.useState(false);
  const [filter, setFilter] = React.useState<DisabilityType | "todas">("todas");
  const [selectOccurrenceMode, setSelectOccurrenceMode] = React.useState(false);
  const [selectedOccurrenceCoords, setSelectedOccurrenceCoords] =
    React.useState<{ latitude: number; longitude: number } | undefined>();
  const occurrenceMarkerRef = React.useRef<any>(null);
  const [editingOccurrence, setEditingOccurrence] = React.useState<
    Occurrence | undefined
  >(undefined);
  const userMarkerRef = React.useRef<any>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [routesOpen, setRoutesOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsOccurrence, setDetailsOccurrence] = React.useState<
    Occurrence | undefined
  >(undefined);
  const routePlannerHiddenRef = React.useRef<any>(null);
  const routePlannerDialogRef = React.useRef<any>(null);
  const [legendOpen, setLegendOpen] = React.useState(false);
  const [twoTapActive, setTwoTapActive] = React.useState(false);
  const [currentUserId, setCurrentUserId] = React.useState<
    string | undefined
  >();
  const [currentUserName, setCurrentUserName] = React.useState<
    string | undefined
  >();
  const [route, setRoute] = React.useState<"home" | "login" | "ranking" | "signup">(
    "login"
  );
  const [newRating, setNewRating] = React.useState<number>(5);
  const [loginError, setLoginError] = React.useState<string | undefined>();
  const [signupError, setSignupError] = React.useState<string | undefined>();
  const [loginPwdVisible, setLoginPwdVisible] = React.useState<boolean>(false);
  const [signupPwdVisible, setSignupPwdVisible] = React.useState<boolean>(false);
  const [signupConfirmVisible, setSignupConfirmVisible] = React.useState<boolean>(false);

  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const isMapbox = Boolean(mapboxToken);

  React.useEffect(() => {
    if (route !== "home") return;
    // Carrega ocorrências armazenadas (IndexedDB) ao iniciar
    loadOccurrences()
      .then((all) => {
        if (all && all.length) setOccurrences(all);
      })
      .catch(() => {});

    let mapInstance: mapboxgl.Map | maplibregl.Map;
    if (isMapbox) {
      mapboxgl.accessToken = mapboxToken as string;
      mapInstance = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-46.656609, -23.561732],
        zoom: 14,
        attributionControl: true,
      });
      mapInstance.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true })
      );
    } else {
      mapInstance = new maplibregl.Map({
        container: mapContainerRef.current!,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        center: [-46.656609, -23.561732],
        zoom: 14,
      });
      mapInstance.addControl(
        new maplibregl.NavigationControl({ visualizePitch: true }) as any
      );
    }

    // Mantém a rota atual; se houver usuário lembrado, apenas carrega dados
    const storedId = localStorage.getItem("currentUserId") || undefined;
    const storedName = localStorage.getItem("currentUserName") || undefined;
    if (storedId) {
      setCurrentUserId(storedId);
      setCurrentUserName(storedName || undefined);
    }

    // Localização do usuário com fallback e marcador acessível
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;
          mapInstance.setCenter([lng, lat]);
          mapInstance.zoomTo(16);

          if (userMarkerRef.current) userMarkerRef.current.remove();
          const el = document.createElement("div");
          el.setAttribute("role", "img");
          el.setAttribute("aria-label", "Minha localização atual");
          el.style.width = "28px";
          el.style.height = "28px";
          el.style.background = "transparent";
          el.innerHTML =
            '<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l5 18-5-4-5 4 5-18z" fill="#0B74DE"/></svg>';
          el.style.boxShadow =
            "0 0 0 8px rgba(11,116,222,0.25), 0 2px 8px rgba(0,0,0,0.2)";
          userMarkerRef.current = (
            isMapbox
              ? new mapboxgl.Marker({ element: el })
              : new maplibregl.Marker({ element: el } as any)
          )
            .setLngLat([lng, lat])
            .addTo(mapInstance as any);
        },
        () => {
          // Sem localização, mantém centro padrão
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, [isMapbox, mapboxToken, route]);

  React.useEffect(() => {
    if (route === "home" && map) {
      try {
        (map as any).resize?.();
      } catch {}
    }
  }, [route, map, detailsOpen]);

  React.useEffect(() => {
    if (route === "home" && map && detailsOpen && detailsOccurrence) {
      try {
        (map as any).easeTo?.({
          center: [detailsOccurrence.longitude, detailsOccurrence.latitude],
          zoom: 17,
        });
      } catch {}
    }
  }, [route, map, detailsOpen, detailsOccurrence]);

  React.useEffect(() => {
    if (!map) return;
    function onClick(e: any) {
      if (!selectOccurrenceMode) return;
      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;
      setSelectedOccurrenceCoords({ latitude: lat, longitude: lng });
      if (occurrenceMarkerRef.current) occurrenceMarkerRef.current.remove();
      const el = document.createElement("div");
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", "Local da ocorrência");
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid #111";
      el.style.backgroundColor = "#FF5722";
      occurrenceMarkerRef.current = (
        isMapbox
          ? new mapboxgl.Marker({ element: el, draggable: true })
          : new maplibregl.Marker({ element: el, draggable: true } as any)
      )
        .setLngLat([lng, lat])
        .addTo(map as any);
      if (occurrenceMarkerRef.current) {
        occurrenceMarkerRef.current.on("dragend", () => {
          const pos = occurrenceMarkerRef.current!.getLngLat();
          setSelectedOccurrenceCoords({
            latitude: pos.lat,
            longitude: pos.lng,
          });
        });
      }
      setSelectOccurrenceMode(false);
      setOpenForm(true);
    }
    (map as any).on("click", onClick);
    return () => {
      (map as any).off("click", onClick);
    };
  }, [map, selectOccurrenceMode]);

  React.useEffect(() => {
    if (!map) return;

    // Remove marcadores anteriores
    markers.forEach((m) => m.remove());

    let filtered = occurrences;
    if (filter !== "todas") {
      filtered = filtered.filter((o) => o.disabilityTypes.includes(filter));
    }
    // Apenas filtro por deficiência

    const nextMarkers = filtered.map((o) => {
      const color = levelToColor(o.level);
      const el = document.createElement("div");
      el.setAttribute("role", "img");
      el.setAttribute(
        "aria-label",
        `${o.title} — nível ${o.level} — problema ${o.problemType}`
      );
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid #111";
      el.style.backgroundColor = color;
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";
      el.tabIndex = 0;
      el.addEventListener("click", () => {
        setDetailsOccurrence(o);
        setDetailsOpen(true);
        setSelectedOccurrenceCoords({
          latitude: o.latitude,
          longitude: o.longitude,
        });
      });
      el.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          setDetailsOccurrence(o);
          setDetailsOpen(true);
          setSelectedOccurrenceCoords({
            latitude: o.latitude,
            longitude: o.longitude,
          });
        }
      });

      const marker = (
        isMapbox
          ? new mapboxgl.Marker({ element: el })
          : new maplibregl.Marker({ element: el } as any)
      )
        .setLngLat([o.longitude, o.latitude])
        .addTo(map as any);
      return marker;
    });

    setMarkers(nextMarkers);
  }, [map, occurrences, filter]);

  function levelToColor(level: AccessibilityLevel) {
    switch (level) {
      case "verde":
        return "#137B39";
      case "amarelo":
        return "#8A7000";
      case "vermelho":
        return "#A61222";
    }
  }

  async function handleSubmit(formData: FormData) {
    const title = String(formData.get("title") || "");
    const description = String(formData.get("description") || "");
    const level = String(
      formData.get("level") || "amarelo"
    ) as AccessibilityLevel;
    const category = String(
      formData.get("category") || "calcadas"
    ) as LocationCategory;
    const problemType = String(
      formData.get("problemType") || "outro"
    ) as Occurrence["problemType"];
    const problemOtherText = String(formData.get("problemOther") || "");
    const disabilities = String(formData.get("disabilities") || "motora")
      .split(",")
      .filter(Boolean) as DisabilityType[];
    const idFromForm = String(formData.get("id") || "");
    const photoFile = (formData.get("photo") as File) || null;
    async function fileToDataUrl(file: File): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    const photoUrl = photoFile ? await fileToDataUrl(photoFile) : undefined;

    // Pega centro atual do mapa como posição
    const longitude =
      selectedOccurrenceCoords?.longitude ??
      map?.getCenter()?.lng ??
      -46.656609;
    const latitude =
      selectedOccurrenceCoords?.latitude ?? map?.getCenter()?.lat ?? -23.561732;

    if (editingOccurrence || idFromForm) {
      const updated: Occurrence = {
        id:
          editingOccurrence?.id ||
          idFromForm ||
          Math.random().toString(36).slice(2),
        title,
        description,
        level,
        disabilityTypes: disabilities,
        category,
        problemType,
        problemOtherText:
          problemOtherText || editingOccurrence?.problemOtherText,
        longitude,
        latitude,
        createdAt: editingOccurrence?.createdAt || new Date().toISOString(),
        photoUrl: photoUrl ?? editingOccurrence?.photoUrl,
        createdBy: editingOccurrence?.createdBy ?? currentUserId,
        evaluations: editingOccurrence?.evaluations,
      };
      setOccurrences((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      saveOccurrence(updated).catch(() => {});
      setEditingOccurrence(undefined);
    } else {
      const n: Occurrence = {
        id: Math.random().toString(36).slice(2),
        title,
        description,
        level,
        disabilityTypes: disabilities,
        category,
        problemType,
        problemOtherText,
        longitude,
        latitude,
        createdAt: new Date().toISOString(),
        photoUrl,
        createdBy: currentUserId,
        evaluations: [],
      };
      setOccurrences((prev) => [n, ...prev]);
      saveOccurrence(n).catch(() => {});
    }
    setSelectedOccurrenceCoords(undefined);
  }

  function handleDelete() {
    if (!editingOccurrence) return;
    const id = editingOccurrence.id;
    setOccurrences((prev) => prev.filter((o) => o.id !== id));
    deleteOccurrence(id).catch(() => {});
    setEditingOccurrence(undefined);
    setOpenForm(false);
    setSelectedOccurrenceCoords(undefined);
  }

  return route === "login" ? (
    <div className="relative h-full">
      <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-300 bg-white p-4 shadow-2xl focus:outline-none md:p-6">
        <div className="flex items-center justify-center gap-3">
          <Route className="h-6 w-6 text-neutral-900" aria-hidden="true" />
          <h2 className="text-xl font-bold text-center">Rota Acessível</h2>
        </div>
        <p className="mt-2 text-center text-sm text-neutral-700">
          Mobilidade urbana inclusiva e colaborativa
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-md border px-2 py-1 text-center text-xs text-neutral-900">
            Mapa
          </div>
          <div className="rounded-md border px-2 py-1 text-center text-xs text-neutral-900">
            Rotas
          </div>
          <div className="rounded-md border px-2 py-1 text-center text-xs text-neutral-900">
            Avaliações
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="login-username">Usuário</Label>
            <Input id="login-username" autoComplete="username" />
          </div>
          <div>
            <Label htmlFor="login-password">Senha</Label>
            <div className="flex items-center gap-2">
              <Input id="login-password" type={loginPwdVisible ? "text" : "password"} autoComplete="current-password" />
              <Button type="button" variant="outline" className="h-9" onClick={() => setLoginPwdVisible((v) => !v)}>
                {loginPwdVisible ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </div>
          {loginError && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{loginError}</div>
          )}
          <div className="grid grid-cols-1 gap-2 pt-2">
            <Button
              type="button"
              className="h-12 w-full justify-center"
              onClick={() => {
                const uEl = document.getElementById("login-username") as HTMLInputElement;
                const pEl = document.getElementById("login-password") as HTMLInputElement;
                const username = (uEl?.value || "").trim();
                const password = (pEl?.value || "").trim();
                if (!username || !password) { setLoginError("Informe usuário e senha."); return; }
                const raw = localStorage.getItem("users");
                const users = raw ? JSON.parse(raw) as Record<string, { username: string; password: string; name?: string }> : {};
                const key = username.toLowerCase();
                const found = users[key];
                if (!found || found.password !== password) { setLoginError("Usuário ou senha inválidos."); return; }
                const userId = `user:${key}`;
                setCurrentUserId(userId);
                setCurrentUserName(found.name || username);
                localStorage.setItem("currentUserId", userId);
                localStorage.setItem("currentUserName", found.name || username);
                setLoginError(undefined);
                setRoute("home");
              }}
            >
              Entrar
            </Button>
            <Button type="button" variant="outline" className="h-12 w-full justify-center" onClick={() => setRoute("signup")}>Criar conta</Button>
          </div>
        </div>
      </div>
    </div>
  ) : route === "ranking" ? (
    <div className="relative h-full">
      <div className="fixed left-3 top-[calc(env(safe-area-inset-top)+12px)] z-30 flex gap-2">
        <Button variant="outline" onClick={() => setRoute("home")}>
          Voltar
        </Button>
      </div>
      <div className="mx-auto max-w-2xl p-4">
        <h2 className="text-xl font-bold text-neutral-900">
          Ranking de ocorrências
        </h2>
        <p className="text-neutral-800">Média de avaliações e participação.</p>
        <div className="mt-3 space-y-2">
          {(() => {
            const items = (occurrences || [])
              .map((o) => {
                const evs = o.evaluations || [];
                const sum = evs.reduce((s, e) => s + (e.rating || 0), 0);
                const count = evs.length;
                const avg = count ? Math.round((sum / count) * 10) / 10 : 0;
                return {
                  id: o.id,
                  title: o.title,
                  avg,
                  count,
                  level: o.level,
                  occurrence: o,
                };
              })
              .sort((a, b) => b.count - a.count || b.avg - a.avg)
              .slice(0, 20);
            return items.length ? (
              <ul className="space-y-2">
                {items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">
                        {it.title}
                      </div>
                      <div className="text-sm text-neutral-800">
                        Média {it.avg || "-"}★ • {it.count} avaliações
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDetailsOccurrence(it.occurrence);
                          setSelectedOccurrenceCoords({
                            latitude: it.occurrence.latitude,
                            longitude: it.occurrence.longitude,
                          });
                          setDetailsOpen(true);
                          setRoute("home");
                        }}
                      >
                        Ver no mapa
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-neutral-800">
                Sem avaliações ainda.
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  ) : route === "signup" ? (
    <div className="relative h-full">
      <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-300 bg-white p-4 shadow-2xl focus:outline-none md:p-6">
        <div className="flex items-center justify-center gap-3">
          <Map className="h-6 w-6 text-neutral-900" aria-hidden="true" />
          <h2 className="text-xl font-bold text-center">Criar conta</h2>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="signup-name">Nome</Label>
            <Input id="signup-name" />
          </div>
          <div>
            <Label htmlFor="signup-username">Usuário</Label>
            <Input id="signup-username" autoComplete="username" />
          </div>
          <div>
            <Label htmlFor="signup-password">Senha</Label>
            <div className="flex items-center gap-2">
              <Input id="signup-password" type={signupPwdVisible ? "text" : "password"} autoComplete="new-password" />
              <Button type="button" variant="outline" className="h-9" onClick={() => setSignupPwdVisible((v) => !v)}>
                {signupPwdVisible ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="signup-confirm">Confirmar senha</Label>
            <div className="flex items-center gap-2">
              <Input id="signup-confirm" type={signupConfirmVisible ? "text" : "password"} autoComplete="new-password" />
              <Button type="button" variant="outline" className="h-9" onClick={() => setSignupConfirmVisible((v) => !v)}>
                {signupConfirmVisible ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
          </div>
          {signupError && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{signupError}</div>
          )}
          <div className="grid grid-cols-1 gap-2 pt-2">
            <Button
              type="button"
              className="h-12 w-full justify-center"
              onClick={() => {
                const nEl = document.getElementById("signup-name") as HTMLInputElement;
                const uEl = document.getElementById("signup-username") as HTMLInputElement;
                const pEl = document.getElementById("signup-password") as HTMLInputElement;
                const cEl = document.getElementById("signup-confirm") as HTMLInputElement;
                const name = (nEl?.value || "").trim();
                const username = (uEl?.value || "").trim();
                const password = (pEl?.value || "").trim();
                const confirm = (cEl?.value || "").trim();
                if (!username || !password) { setSignupError("Informe usuário e senha."); return; }
                if (password.length < 6) { setSignupError("Senha deve ter ao menos 6 caracteres."); return; }
                if (password !== confirm) { setSignupError("As senhas não coincidem."); return; }
                const raw = localStorage.getItem("users");
                const users = raw ? JSON.parse(raw) as Record<string, { username: string; password: string; name?: string }> : {};
                const key = username.toLowerCase();
                if (users[key]) { setSignupError("Usuário já existe."); return; }
                users[key] = { username, password, name: name || undefined };
                localStorage.setItem("users", JSON.stringify(users));
                const userId = `user:${key}`;
                setCurrentUserId(userId);
                setCurrentUserName(name || username);
                localStorage.setItem("currentUserId", userId);
                localStorage.setItem("currentUserName", name || username);
                setSignupError(undefined);
                setRoute("home");
              }}
            >
              Criar e entrar
            </Button>
            <Button type="button" variant="outline" className="h-12 w-full justify-center" onClick={() => setRoute("login")}>Já tenho conta</Button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="relative h-full">
      {selectOccurrenceMode && (
        <div
          role="alert"
          className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-md bg-white px-4 py-2 shadow-xl"
        >
          Toque no mapa para selecionar o local da ocorrência
        </div>
      )}
      <div className="fixed left-3 top-[calc(env(safe-area-inset-top)+12px)] z-30 flex flex-col gap-2">
        <Button
          variant="outline"
          className="h-12 min-w-[180px] bg-white justify-start gap-2"
          aria-expanded={filtersOpen}
          aria-label={filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <Filter className="h-5 w-5" aria-hidden="true" />
          Filtros
        </Button>
        <Button
          className="h-12 min-w-[180px] justify-start gap-2"
          aria-expanded={routesOpen}
          onClick={() => setRoutesOpen((v) => !v)}
        >
          <Map className="h-5 w-5" aria-hidden="true" />
          {routesOpen ? "Ocultar rotas" : "Planejar rotas"}
        </Button>
        <Button
          variant="outline"
          className="h-12 min-w-[180px] bg-white justify-start gap-2"
          onClick={() => setRoute("ranking")}
        >
          <BarChart2 className="h-5 w-5" aria-hidden="true" />
          Ranking
        </Button>
        <Button
          variant="outline"
          className="h-12 min-w-[180px] bg-red-600 hover:bg-red-500 text-white justify-start gap-2"
          onClick={() => {
            localStorage.removeItem("currentUserId");
            localStorage.removeItem("currentUserName");
            setCurrentUserId(undefined);
            setCurrentUserName(undefined);
            setRoute("login");
          }}
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Sair
        </Button>
      </div>
      <Dialog open={filtersOpen} modal={false} onOpenChange={setFiltersOpen}>
        <DialogContent>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            Filtrar por deficiência
          </label>
          <select
            aria-label="Filtrar marcadores por tipo de deficiência"
            className="h-12 w-full rounded-md border border-neutral-400 px-3 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="todas">Todas</option>
            <option value="motora">Motora</option>
            <option value="visual">Visual</option>
            <option value="auditiva">Auditiva</option>
            <option value="multipla">Múltipla</option>
          </select>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full justify-center"
              onClick={() => {
                setFilter("todas");
              }}
            >
              Limpar filtros
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Container do mapa com role region e label acessível */}
      <div
        ref={mapContainerRef}
        role="region"
        aria-label="Mapa interativo de acessibilidade urbana"
        className="h-full w-full"
      />

      <FloatingActionButton
        onClick={() => setOpenForm(true)}
        offset={filtersOpen || routesOpen ? "raised" : "normal"}
        placement="right"
      />

      <Dialog
        open={detailsOpen}
        modal={false}
        onOpenChange={(v) => {
          setDetailsOpen(v);
          if (!v) setDetailsOccurrence(undefined);
        }}
      >
        <DialogContent>
          {detailsOccurrence && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-neutral-900">
                  {detailsOccurrence.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: levelToColor(detailsOccurrence.level),
                      }}
                      aria-hidden="true"
                    ></span>
                    {detailsOccurrence.level === "verde"
                      ? "Verde — Acessível"
                      : detailsOccurrence.level === "amarelo"
                      ? "Amarelo — Parcial"
                      : "Vermelho — Inacessível"}
                  </span>
                  <span>
                    Categoria:{" "}
                    {detailsOccurrence.category === "calcadas"
                      ? "Calçadas"
                      : detailsOccurrence.category === "edificios_publicos"
                      ? "Edifícios públicos"
                      : "Meios de transporte"}
                  </span>
                </div>
              </div>

              {detailsOccurrence.photoUrl && (
                <div className="rounded-md border p-2">
                  <img
                    src={detailsOccurrence.photoUrl}
                    alt="Foto da ocorrência"
                    className="max-h-56 w-auto rounded-md"
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="text-neutral-800">
                  {detailsOccurrence.description || "Sem descrição"}
                </p>
                <div className="text-neutral-900">
                  Problema:{" "}
                  {detailsOccurrence.problemType === "calcada_quebrada"
                    ? "Calçada quebrada"
                    : detailsOccurrence.problemType === "falta_rampa"
                    ? "Falta de rampa"
                    : detailsOccurrence.problemType === "obstaculo"
                    ? "Obstáculo na passagem"
                    : detailsOccurrence.problemType === "buraco"
                    ? "Buraco"
                    : detailsOccurrence.problemType === "desnivel"
                    ? "Desnível"
                    : detailsOccurrence.problemType === "rampa_inadequada"
                    ? "Rampa inadequada"
                    : detailsOccurrence.problemType === "acesso_bloqueado"
                    ? "Acesso bloqueado"
                    : detailsOccurrence.problemType === "banheiro_inacessivel"
                    ? "Banheiro inacessível"
                    : detailsOccurrence.problemType === "ponto_sem_rampa"
                    ? "Ponto sem rampa"
                    : detailsOccurrence.problemType === "onibus_sem_elevador"
                    ? "Ônibus sem elevador"
                    : detailsOccurrence.problemType === "estacao_sem_acesso"
                    ? "Estação sem acesso"
                    : detailsOccurrence.problemType === "outro"
                    ? detailsOccurrence.problemOtherText || "Outro"
                    : "Outro"}
                </div>
                <div>
                  Deficiências:{" "}
                  {detailsOccurrence.disabilityTypes.map((d) => d).join(", ")}
                </div>
              </div>

              <div className="text-sm text-neutral-700">
                Coordenadas: lat {detailsOccurrence.latitude.toFixed(5)}, lng{" "}
                {detailsOccurrence.longitude.toFixed(5)}
              </div>
              <div className="text-sm text-neutral-700">
                Criado em:{" "}
                {new Date(detailsOccurrence.createdAt).toLocaleString("pt-BR")}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {detailsOccurrence.createdBy &&
                  currentUserId === detailsOccurrence.createdBy && (
                    <Button
                      type="button"
                      onClick={() => {
                        setDetailsOpen(false);
                        setEditingOccurrence(detailsOccurrence);
                        setOpenForm(true);
                        setSelectedOccurrenceCoords({
                          latitude: detailsOccurrence.latitude,
                          longitude: detailsOccurrence.longitude,
                        });
                      }}
                    >
                      Editar
                    </Button>
                  )}
              </div>

              <div className="space-y-2">
                {(() => {
                  const evals = detailsOccurrence.evaluations || [];
                  const avg = evals.length
                    ? Math.round(
                        (evals.reduce((s, e) => s + (e.rating || 0), 0) /
                          evals.length) *
                          10
                      ) / 10
                    : 0;
                  return (
                    <div className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-neutral-900">
                          Avaliações colaborativas
                        </div>
                        <div className="text-sm text-neutral-900">
                          Média: {avg || "-"}{" "}
                          {evals.length ? `(${evals.length})` : ""}
                        </div>
                      </div>
                      {evals.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {evals.slice(0, 5).map((e, i) => (
                            <li key={i} className="text-sm text-neutral-800">
                              {e.rating}★ {e.comment || ""}
                            </li>
                          ))}
                        </ul>
                      )}
                      {currentUserId && (
                        <div className="mt-3 grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-900">
                              Sua nota
                            </span>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                aria-label={`${n} estrelas`}
                                onClick={() => setNewRating(n)}
                                className="inline-flex"
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    newRating >= n
                                      ? "text-yellow-500"
                                      : "text-neutral-400"
                                  }`}
                                  aria-hidden="true"
                                />
                              </button>
                            ))}
                          </div>
                          <Input
                            id="rate-comment"
                            placeholder="Opcional: comentário"
                          />
                          <Button
                            type="button"
                            className="h-11"
                            onClick={() => {
                              const cEl = document.getElementById(
                                "rate-comment"
                              ) as HTMLInputElement;
                              const rating = Math.max(
                                1,
                                Math.min(5, newRating)
                              );
                              const comment = (cEl?.value || "").trim();
                              const ev: Evaluation = {
                                userId: currentUserId!,
                                rating,
                                comment,
                                createdAt: new Date().toISOString(),
                              };
                              setOccurrences((prev) =>
                                prev.map((o) =>
                                  o.id === detailsOccurrence.id
                                    ? {
                                        ...o,
                                        evaluations: [
                                          ...(o.evaluations || []),
                                          ev,
                                        ],
                                      }
                                    : o
                                )
                              );
                              const updated = {
                                ...detailsOccurrence,
                                evaluations: [
                                  ...(detailsOccurrence.evaluations || []),
                                  ev,
                                ],
                              } as Occurrence;
                              saveOccurrence(updated).catch(() => {});
                              setDetailsOccurrence(updated);
                            }}
                          >
                            Enviar avaliação
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AddOccurrenceForm
        open={openForm}
        onOpenChange={(v) => {
          setOpenForm(v);
          if (!v) setEditingOccurrence(undefined);
        }}
        onSubmit={handleSubmit}
        selectedCoords={selectedOccurrenceCoords}
        onRequestMapSelect={() => setSelectOccurrenceMode(true)}
        initial={
          editingOccurrence
            ? {
                id: editingOccurrence.id,
                title: editingOccurrence.title,
                description: editingOccurrence.description,
                level: editingOccurrence.level,
                category: editingOccurrence.category,
                problemType: editingOccurrence.problemType,
                disabilities: editingOccurrence.disabilityTypes,
                problemOtherText: editingOccurrence.problemOtherText,
              }
            : undefined
        }
        onDelete={editingOccurrence ? handleDelete : undefined}
      />

      <button
        className={`fixed left-3 ${
          filtersOpen || routesOpen ? "bottom-24 md:bottom-6" : "bottom-6"
        } z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-900 shadow-xl focus:outline-none focus:ring-2 focus:ring-primary`}
        aria-label="Abrir legenda de acessibilidade"
        onClick={() => setLegendOpen(true)}
      >
        <Info className="h-5 w-5" aria-hidden="true" />
      </button>
      <Dialog open={legendOpen} modal={false} onOpenChange={setLegendOpen}>
        <DialogContent>
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            Rota Acessível
          </h2>
          <p className="text-neutral-800 mb-2">
            Aplicativo colaborativo para mapear, avaliar e planejar rotas
            acessíveis em centros urbanos.
          </p>
          <p className="text-neutral-800 mb-2">
            Contribui com o ODS 11 (Cidades e Comunidades Sustentáveis) ao
            promover mobilidade inclusiva e participação social.
          </p>
          <p className="text-neutral-800 mb-3">
            Funciona offline para rotas simples e suporta fotos, filtros por
            deficiência e classificação visual.
          </p>
          <p className="mb-2 text-sm font-semibold text-neutral-900">
            Legenda de acessibilidade
          </p>
          <div
            className="flex items-center gap-3"
            aria-label="Legenda de cores"
          >
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: "#137B39" }}
                aria-hidden="true"
              ></span>{" "}
              Verde — Acessível
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: "#8A7000" }}
                aria-hidden="true"
              ></span>{" "}
              Amarelo — Parcial
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: "#A61222" }}
                aria-hidden="true"
              ></span>{" "}
              Vermelho — Inacessível
            </span>
          </div>
        </DialogContent>
      </Dialog>

      <div
        className={`fixed right-6 ${
          filtersOpen || routesOpen ? "bottom-24 md:bottom-6" : "bottom-6"
        } z-30 flex flex-col gap-2`}
      >
        <button
          aria-label="Minha localização"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-neutral-900 shadow-xl focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={() => {
            if (!map) return;
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const lng = pos.coords.longitude;
                  const lat = pos.coords.latitude;
                  (map as any).setCenter([lng, lat]);
                  (map as any).zoomTo(16);
                  if (userMarkerRef.current) userMarkerRef.current.remove();
                  const el = document.createElement("div");
                  el.setAttribute("role", "img");
                  el.setAttribute("aria-label", "Minha localização atual");
                  el.style.width = "28px";
                  el.style.height = "28px";
                  el.style.background = "transparent";
                  el.innerHTML =
                    '<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l5 18-5-4-5 4 5-18z" fill="#0B74DE"/></svg>';
                  el.style.boxShadow =
                    "0 0 0 8px rgba(11,116,222,0.25), 0 2px 8px rgba(0,0,0,0.2)";
                  userMarkerRef.current = (
                    isMapbox
                      ? new mapboxgl.Marker({ element: el })
                      : new maplibregl.Marker({ element: el } as any)
                  )
                    .setLngLat([lng, lat])
                    .addTo(map as any);
                },
                () => {},
                { enableHighAccuracy: true, maximumAge: 0 }
              );
            }
          }}
        >
          <Send className="h-6 w-6" aria-hidden="true" />
        </button>
        <FloatingActionButton
          onClick={() => setOpenForm(true)}
          offset={filtersOpen || routesOpen ? "raised" : "normal"}
          placement="right"
          noFixed={true}
        />
      </div>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] left-1/2 z-20 -translate-x-1/2 flex gap-2">
        <Button
          size="lg"
          onClick={() => {
            setFiltersOpen(false);
            routePlannerHiddenRef.current?.startTwoTap();
          }}
        >
          Planejar com dois toques no mapa
        </Button>
        {twoTapActive && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              routePlannerHiddenRef.current?.cancelSelection?.();
            }}
          >
            Cancelar seleção
          </Button>
        )}
      </div>

      <Dialog open={routesOpen} modal={false} onOpenChange={setRoutesOpen}>
        <DialogContent>
          <RoutePlanner
            ref={routePlannerDialogRef}
            map={map}
            tokenPresent={Boolean(mapboxToken)}
            isMapbox={Boolean(mapboxToken)}
            occurrences={occurrences}
            collapsed={false}
            variant={"sheet"}
            onRequestClose={() => setRoutesOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Planejador oculto para fluxo direto no mapa (sem abrir modal) */}
      <RoutePlanner
        ref={routePlannerHiddenRef}
        map={map}
        tokenPresent={Boolean(mapboxToken)}
        isMapbox={Boolean(mapboxToken)}
        occurrences={occurrences}
        collapsed={true}
        variant={"sheet"}
        onSelectionModeChange={(m) => setTwoTapActive(m !== "none")}
      />
    </div>
  );
}
