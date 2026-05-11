import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Share, MoreVertical, Plus, Download, Check, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/.test(userAgent)) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Allerede installert!</CardTitle>
            <CardDescription>
              Budget App er allerede installert på enheten din.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tilbake til appen
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold">Installer Budget App</h1>
            <p className="text-sm text-muted-foreground">Legg til på hjemskjermen</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Hero section */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent border-none">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-20 h-20 bg-background rounded-2xl shadow-lg flex items-center justify-center mb-4">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Få full app-opplevelse</h2>
            <p className="text-muted-foreground mb-4">
              Installer Budget App på hjemskjermen for raskere tilgang, offline-støtte og en bedre brukeropplevelse.
            </p>
            
            {deferredPrompt && (
              <Button onClick={handleInstallClick} size="lg" className="gap-2">
                <Download className="w-5 h-5" />
                Installer nå
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Platform-specific instructions */}
        <Tabs defaultValue={platform} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ios">iPhone / iPad</TabsTrigger>
            <TabsTrigger value="android">Android</TabsTrigger>
          </TabsList>

          <TabsContent value="ios" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Slik installerer du på iOS</CardTitle>
                <CardDescription>
                  Følg disse stegene i Safari-nettleseren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-semibold text-primary">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Åpne i Safari</p>
                    <p className="text-sm text-muted-foreground">
                      Sørg for at du bruker Safari-nettleseren. Andre nettlesere støtter ikke installasjon på iOS.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-semibold text-primary">2</span>
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      Trykk på Del-knappen
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-muted rounded">
                        <Share className="w-4 h-4" />
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Du finner den nederst (iPhone) eller øverst (iPad) i Safari.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-semibold text-primary">3</span>
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      Velg «Legg til på Hjem-skjerm»
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-muted rounded">
                        <Plus className="w-4 h-4" />
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Bla ned i menyen hvis du ikke ser valget med en gang.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-semibold text-primary">4</span>
                  </div>
                  <div>
                    <p className="font-medium">Bekreft med «Legg til»</p>
                    <p className="text-sm text-muted-foreground">
                      Budget App-ikonet vil nå vises på hjemskjermen din.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="android" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Slik installerer du på Android</CardTitle>
                <CardDescription>
                  Følg disse stegene i Chrome-nettleseren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deferredPrompt ? (
                  <div className="bg-accent/50 rounded-lg p-4 text-center">
                    <p className="font-medium mb-3">Rask installasjon tilgjengelig!</p>
                    <Button onClick={handleInstallClick} className="gap-2">
                      <Download className="w-4 h-4" />
                      Installer Budget App
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-semibold text-primary">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Åpne i Chrome</p>
                        <p className="text-sm text-muted-foreground">
                          For best resultat, bruk Google Chrome-nettleseren.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-semibold text-primary">2</span>
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          Trykk på menyknappen
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-muted rounded">
                            <MoreVertical className="w-4 h-4" />
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Du finner de tre prikkene øverst til høyre i Chrome.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-semibold text-primary">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Velg «Installer app» eller «Legg til på startskjermen»</p>
                        <p className="text-sm text-muted-foreground">
                          Teksten kan variere litt mellom ulike Android-versjoner.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="font-semibold text-primary">4</span>
                      </div>
                      <div>
                        <p className="font-medium">Bekreft installasjonen</p>
                        <p className="text-sm text-muted-foreground">
                          Budget App vil nå være tilgjengelig som en app på telefonen din.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fordeler med å installere</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Raskere oppstart – ingen nettleser-meny</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Fungerer offline eller med dårlig nett</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Fullskjerm-opplevelse uten adressefelt</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Eget app-ikon på hjemskjermen</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Install;
