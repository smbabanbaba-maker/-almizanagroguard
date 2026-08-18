import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const appBase = import.meta.env.BASE_URL.replace(/\/$/, "");
const isGitHubPagesBuild = Boolean(appBase);
const appPath = (path: string) => {
  if (!appBase) return path;
  return path === "/" ? `${appBase}/` : `${appBase}${path}`;
};

function Router() {
  return (
    <Switch>
      <Route path={appPath("/")} component={Home} />
      <Route path={appPath("/crop-health")} component={Home} />
      <Route path={appPath("/weather")} component={Home} />
      <Route path={appPath("/ask")} component={Home} />
      <Route path={appPath("/farm")} component={Home} />
      <Route path={appPath("/404")} component={NotFound} />
      <Route component={isGitHubPagesBuild ? Home : NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
