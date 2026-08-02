import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Globe2,
  HeartPulse,
  Network,
  Route,
  Server,
  ShieldCheck,
  Timer,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: HeartPulse,
    title: "Real-Time Health Checks",
    description: "Continuously monitor server availability and responsiveness.",
  },
  {
    icon: Route,
    title: "Intelligent DNS Routing",
    description:
      "Automatically answer DNS queries using only healthy endpoints.",
  },
  {
    icon: Timer,
    title: "Fast Failure Detection",
    description:
      "Detect outages quickly and redirect traffic before users notice.",
  },
  {
    icon: Globe2,
    title: "Multi-Region Infrastructure",
    description:
      "Distribute traffic across multiple locations for improved reliability.",
  },
];

const steps = [
  {
    title: "Register Zones",
    description: "Register your domains and DNS zones.",
  },
  {
    title: "Configure Backends",
    description: "Configure backend servers and health checks.",
  },
  {
    title: "Continuous Monitoring",
    description: "The system continuously monitors server health.",
  },
  {
    title: "Smart Routing",
    description: "DNS responses automatically route users to healthy servers.",
  },
];

const servers = [
  {
    name: "Server A",
    status: "Healthy",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    dot: "bg-emerald-500",
  },
  {
    name: "Server B",
    status: "Healthy",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    dot: "bg-emerald-500",
  },
  {
    name: "Server C",
    status: "Unreachable",
    color: "text-red-600",
    bg: "bg-red-100",
    dot: "bg-red-500",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "High Availability",
    description: "Keep services reachable during server failures.",
  },
  {
    icon: Route,
    title: "Automatic Failover",
    description: "Traffic is redirected without manual intervention.",
  },
  {
    icon: Network,
    title: "Infrastructure Ready",
    description:
      "Designed for production DNS environments and distributed deployments.",
  },
];

function Node({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return <circle cx={cx} cy={cy} r="6" fill={color} />;
}

function NetworkDiagram() {
  return (
    <svg
      className="w-full h-full"
      width="520"
      height="460"
      viewBox="0 0 520 460"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", background: "#fafafa" }}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#10b981" />
        </marker>
        <marker
          id="arrow-amber"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="#f59e0b" />
        </marker>
      </defs>

      {/* background grid */}
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M32 0H0V32" fill="none" stroke="#e2e8f0" strokeWidth="1" />
      </pattern>
      <rect width="520" height="460" fill="url(#grid)" />

      <text
        x={70}
        y={50}
        textAnchor="middle"
        fontSize="12"
        fill="#64748b"
        fontWeight={600}
      >
        Global Users
      </text>
      <path d="M70 90 V200" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
      <Node cx={70} cy={90} color="#94a3b8" />
      <Node cx={70} cy={145} color="#94a3b8" />
      <Node cx={70} cy={200} color="#94a3b8" />

      {/* DNS router */}
      <rect
        x={195}
        y={90}
        width={130}
        height={64}
        rx="14"
        fill="#ffffff"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      <text
        x={260}
        y={114}
        textAnchor="middle"
        fontSize="13"
        fontWeight={700}
        fill="#047857"
      >
        DNS Router
      </text>
      <text x={260} y={132} textAnchor="middle" fontSize="11" fill="#10b981">
        ● Routing Active
      </text>

      {/* server A */}
      <rect
        x={40}
        y={340}
        width={112}
        height={72}
        rx="12"
        fill="#ffffff"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      <text
        x={96}
        y={364}
        textAnchor="middle"
        fontSize="12"
        fontWeight={700}
        fill="#0f172a"
      >
        Server A
      </text>
      <circle cx={72} cy={386} r="4" fill="#10b981" />
      <text x={84} y={390} fontSize="10" fill="#10b981">
        Healthy
      </text>

      {/* server B */}
      <rect
        x={204}
        y={340}
        width={112}
        height={72}
        rx="12"
        fill="#ffffff"
        stroke="#10b981"
        strokeWidth="1.5"
      />
      <text
        x={260}
        y={364}
        textAnchor="middle"
        fontSize="12"
        fontWeight={700}
        fill="#0f172a"
      >
        Server B
      </text>
      <circle cx={236} cy={386} r="4" fill="#10b981" />
      <text x={248} y={390} fontSize="10" fill="#10b981">
        Healthy
      </text>

      {/* server C (unreachable) */}
      <rect
        x={368}
        y={340}
        width={112}
        height={72}
        rx="12"
        fill="#fef2f2"
        stroke="#ef4444"
        strokeWidth="1.5"
      />
      <text
        x={424}
        y={364}
        textAnchor="middle"
        fontSize="12"
        fontWeight={700}
        fill="#991b1b"
      >
        Server C
      </text>
      <circle cx={400} cy={386} r="4" fill="#ef4444" />
      <text x={412} y={390} fontSize="10" fill="#ef4444">
        Unreachable
      </text>

      {/* users -> router (solid traffic) */}
      <path
        d="M70 90 L195 102"
        stroke="#10b981"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrow)"
      />
      <path
        d="M70 145 L195 122"
        stroke="#10b981"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrow)"
      />
      <path
        d="M70 200 L195 142"
        stroke="#10b981"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrow)"
      />

      {/* router -> healthy servers (solid traffic) */}
      <path
        d="M248 154 L96 340"
        stroke="#10b981"
        strokeWidth="2.5"
        fill="none"
        markerEnd="url(#arrow)"
      />
      <path
        d="M272 154 L260 340"
        stroke="#10b981"
        strokeWidth="2.5"
        fill="none"
        markerEnd="url(#arrow)"
      />

      {/* router -> server C (blocked health check, red dashed with X) */}
      <path
        d="M325 140 L424 340"
        stroke="#ef4444"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        fill="none"
      />
      <g stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
        <line x1={368} y1={228} x2={388} y2={248} />
        <line x1={388} y1={228} x2={368} y2={248} />
      </g>

      {/* traffic rerouted around failure (amber dashed) */}
      <path
        d="M320 130 C 430 200, 190 210, 110 320"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
        markerEnd="url(#arrow-amber)"
      />
    </svg>
  );
}

function DashboardCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-lg shadow-emerald-900/5 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-slate-800">
            Health Monitoring Dashboard
          </span>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          Live
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {servers.map((server) => (
          <div
            key={server.name}
            className="flex items-center justify-between px-5 py-3.5"
          >
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">
                {server.name}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full ${server.bg} px-2.5 py-1 text-xs font-medium ${server.color}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${server.dot}`} />
              {server.status}
            </span>
          </div>
        ))}

        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Route className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">
              DNS Routing Status
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/60">
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500">Last Health Check</p>
          <p className="mt-1 font-mono text-sm font-medium text-slate-800">
            09:41:32 UTC
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-slate-500">Global Availability</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <Activity className="h-4 w-4" /> 99.98%
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/40 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <Globe2 className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Route<span className="text-emerald-600">DNS</span>
            </span>
          </a>

          <Link
            href="/signin"
            className="rounded-lg border cursor-pointer border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-emerald-500 hover:text-emerald-600 hover:bg-white"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.08),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(20,184,166,0.06),transparent_50%)]" />
            <svg
              className="absolute inset-0 h-full w-full opacity-[0.35]"
              viewBox="0 0 800 800"
              fill="none"
            >
              <g stroke="#10b981" strokeOpacity="0.12" strokeWidth="1">
                <path d="M0 100 H800" />
                <path d="M0 300 H800" />
                <path d="M0 500 H800" />
                <path d="M0 700 H800" />
                <path d="M150 0 V800" />
                <path d="M400 0 V800" />
                <path d="M650 0 V800" />
                <circle
                  cx="400"
                  cy="300"
                  r="3"
                  fill="#10b981"
                  fillOpacity="0.2"
                />
                <circle
                  cx="150"
                  cy="500"
                  r="3"
                  fill="#10b981"
                  fillOpacity="0.2"
                />
                <circle
                  cx="650"
                  cy="100"
                  r="3"
                  fill="#10b981"
                  fillOpacity="0.2"
                />
                <circle
                  cx="650"
                  cy="700"
                  r="3"
                  fill="#10b981"
                  fillOpacity="0.2"
                />
              </g>
            </svg>
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Authoritative DNS Routing Platform
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                Intelligent DNS Routing for{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Highly Available
                </span>{" "}
                Infrastructure
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                Route users to healthy servers using real-time health monitoring
                and intelligent DNS responses. Automatically detect failures,
                remove unhealthy endpoints, and direct traffic where it belongs.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-emerald-700/25"
                >
                  Start Now
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-emerald-500 hover:text-emerald-600"
                >
                  <BookOpen className="h-4 w-4" />
                  Documentation
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-emerald-100/70 to-teal-100/50 blur-xl" />
              <div
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-xl shadow-emerald-900/5 backdrop-blur-sm w-full max-w-[520px] mx-auto"
                style={{ aspectRatio: "520 / 460" }}
              >
                <NetworkDiagram />
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Built for Reliable DNS Infrastructure
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Everything you need to keep DNS answers accurate and traffic
              flowing to healthy endpoints.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-900/5"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-y border-slate-200/70 bg-white scroll-mt-24"
        >
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Deploy authoritative DNS routing in four simple steps.
              </p>
            </div>

            <div className="relative mt-14 grid gap-10 md:grid-cols-4">
              <svg
                className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px w-full md:block"
                preserveAspectRatio="none"
                viewBox="0 0 100 1"
              >
                <line
                  x1="0"
                  y1="0.5"
                  x2="100"
                  y2="0.5"
                  stroke="#d1fae5"
                  strokeWidth="1"
                />
              </svg>
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="relative flex flex-col items-center text-center md:items-start md:text-left"
                >
                  <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-600/25">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="monitoring"
          className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20"
        >
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                <Activity className="h-3.5 w-3.5" />
                Real-Time Visibility
              </span>
              <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
                Watch Every Endpoint, Live
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Health checks run continuously across all configured servers.
                Unhealthy endpoints are automatically removed from DNS answers
                while routing stays active — so users always reach a working
                server.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-800">
                      Continuous probing
                    </span>{" "}
                    from multiple regions verifies availability and response
                    latency.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-800">
                      Automatic removal
                    </span>{" "}
                    of unreachable servers from the routing pool, with instant
                    failover.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-800">
                      Degraded states
                    </span>{" "}
                    are flagged before they become outages.
                  </p>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-emerald-100/60 to-teal-100/40 blur-xl" />
              <DashboardCard />
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Why Use It
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Purpose-built for production DNS environments that can&apos;t
                afford downtime.
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center transition-all hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg hover:shadow-emerald-900/5"
                >
                  <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-600/25">
                    <benefit.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-emerald-600 to-teal-700" />
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
            viewBox="0 0 800 400"
            fill="none"
          >
            <g stroke="#ffffff" strokeWidth="1">
              <path d="M0 120 Q200 40 400 120 T800 120" />
              <path d="M0 240 Q200 160 400 240 T800 240" />
              <circle cx="200" cy="80" r="3" fill="#ffffff" />
              <circle cx="500" cy="200" r="3" fill="#ffffff" />
              <circle cx="650" cy="120" r="3" fill="#ffffff" />
              <circle cx="300" cy="260" r="3" fill="#ffffff" />
            </g>
          </svg>
          <div className="mx-auto max-w-4xl px-6 py-24 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Keep Your Infrastructure Online
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-emerald-50/90">
              Deploy intelligent DNS routing with continuous health monitoring
              to improve service availability and resilience.
            </p>
            <a
              href="#features"
              className="mt-9 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3 text-sm font-semibold text-emerald-700 shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Start Now
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Globe2 className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold">RouteDNS</span>
          </div>
          <p className="text-sm text-slate-500">
            Self-hosted &amp; managed authoritative DNS routing infrastructure.
          </p>
          <nav className="flex items-center gap-6 text-sm text-slate-500">
            <a
              href="#features"
              className="transition-colors hover:text-slate-900"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-slate-900"
            >
              How It Works
            </a>
            <a
              href="#monitoring"
              className="transition-colors hover:text-slate-900"
            >
              Documentation
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
