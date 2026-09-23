import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const projects = [
  {
    title: "500kVA UPS Array | Lithium-ion Bank",
    category: "DATA CENTER",
    location: "PUNE, INDIA",
    description:
      "High-capacity UPS infrastructure engineered for continuous industrial and enterprise operations.",
    image:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=80",
    featured: true,
  },
  {
    title: "Heavy Machinery Voltage Stabilization",
    category: "AUTOMOTIVE",
    location: "PUNE, INDIA",
    description:
      "Custom voltage stabilization implementation designed for automated industrial machinery and assembly operations.",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Critical Care Backup Power",
    category: "HEALTHCARE",
    location: "PUNE, INDIA",
    description:
      "Reliable backup power infrastructure designed to support critical healthcare operations.",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Industrial Power Distribution",
    category: "INDUSTRIAL",
    location: "MAHARASHTRA, INDIA",
    description:
      "Electrical infrastructure designed for demanding industrial loads and continuous operations.",
    image:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Commercial UPS Installation",
    category: "COMMERCIAL",
    location: "PUNE, INDIA",
    description:
      "Complete UPS installation and commissioning for commercial facilities requiring dependable power continuity.",
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
  },
];

const filters = [
  "ALL",
  "UPS",
  "INSTALLATION",
  "BATTERY BANK",
  "STABILIZER",
  "AMC",
  "INDUSTRIAL",
];

export default function Projects() {
  const navigate = useNavigate();

  const navigatingRef = useRef(false);
  const timeoutRef = useRef(null);

  const [transition, setTransition] = useState("page-visible");

  /*
   * =========================================================
   * PAGE ENTER
   * =========================================================
   */

  useEffect(() => {
    navigatingRef.current = false;

    setTransition("page-enter");

    const timer = window.setTimeout(() => {
      setTransition("page-visible");
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  /*
   * =========================================================
   * NAVIGATION
   * =========================================================
   */

  useEffect(() => {
    const navigateWithTransition = (targetPath) => {
      if (navigatingRef.current) {
        return;
      }

      if (!targetPath) {
        return;
      }

      navigatingRef.current = true;

      /*
       * Start smooth exit animation.
       */
      setTransition("page-exit");

      /*
       * Wait for animation before changing route.
       *
       * navigate() creates a normal browser history entry,
       * so Back / Forward continue to work.
       */
      timeoutRef.current = window.setTimeout(() => {
        navigate(targetPath);
      }, 450);
    };

    /*
     * =======================================================
     * SCROLL
     * =======================================================
     */

    const handleScroll = () => {
      if (navigatingRef.current) {
        return;
      }

      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      const viewportHeight =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        0;

      const documentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );

      /*
       * Projects → Knowledge Center
       */
      const reachedBottom =
        scrollTop + viewportHeight >=
        documentHeight - 30;

      if (reachedBottom) {
        navigateWithTransition("/knowledge");
      }
    };

    /*
     * =======================================================
     * WHEEL
     * =======================================================
     *
     * At the very top:
     *
     * Projects + scroll upward
     *              ↓
     * Industries
     */

    const handleWheel = (event) => {
      if (navigatingRef.current) {
        return;
      }

      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      const atTop = scrollTop <= 5;

      if (atTop && event.deltaY < 0) {
        navigateWithTransition("/industries");
      }
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      window.removeEventListener(
        "wheel",
        handleWheel
      );

      if (timeoutRef.current !== null) {
        window.clearTimeout(
          timeoutRef.current
        );
      }
    };
  }, [navigate]);

  return (
    <>
      {/* =====================================================
          PAGE TRANSITION
      ====================================================== */}

      <style>
        {`
          .skytech-projects-page {
            width: 100%;
            min-height: 100vh;
            background: #f7f9fb;

            transition:
              opacity 450ms ease,
              transform 450ms cubic-bezier(
                0.22,
                1,
                0.36,
                1
              );

            will-change:
              opacity,
              transform;
          }

          .skytech-projects-page.page-enter {
            opacity: 0;
            transform: translateY(18px);
          }

          .skytech-projects-page.page-visible {
            opacity: 1;
            transform: translateY(0);
          }

          .skytech-projects-page.page-exit {
            opacity: 0;
            transform: translateY(-18px);
          }

          @media (prefers-reduced-motion: reduce) {
            .skytech-projects-page {
              transition: opacity 150ms ease;
            }

            .skytech-projects-page.page-enter,
            .skytech-projects-page.page-visible,
            .skytech-projects-page.page-exit {
              transform: none;
            }
          }
        `}
      </style>

      <main
        className={`skytech-projects-page ${transition}`}
      >

        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative overflow-hidden border-b border-[#c5c6cd] bg-[#f7f9fb]">

          {/* Circuit background */}

          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(#c5c6cd 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-16 md:py-20">

            {/* Label */}

            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#d6e3ff] px-3 py-2">

              <span className="h-2 w-2 rounded-full bg-[#0050cc]" />

              <span className="font-mono text-xs font-medium tracking-[0.12em] text-[#0d1c32]">
                PROJECT PORTFOLIO
              </span>

            </div>

            {/* Heading */}

            <h1 className="max-w-4xl font-[Manrope] text-4xl font-extrabold leading-[1.1] tracking-tight text-[#000] md:text-6xl">

              Engineered Solutions.

              <br />

              <span className="text-[#0050cc]">
                Proven Results.
              </span>

            </h1>

            {/* Description */}

            <p className="mt-6 max-w-3xl font-[Inter] text-lg leading-8 text-[#44474d]">
              Explore our portfolio of high-performance electrical
              infrastructure projects, demonstrating structural integrity,
              engineering precision and reliable power solutions across
              different industries.
            </p>

          </div>

        </section>

        {/* =====================================================
            PROJECT FILTERS
        ====================================================== */}

        <section className="border-b border-[#c5c6cd] bg-white">

          <div className="mx-auto max-w-7xl px-4 py-5 md:px-16">

            <div className="flex flex-wrap items-center gap-3">

              {filters.map((filter, index) => (
                <button
                  key={filter}
                  type="button"
                  className={`rounded border px-4 py-2 font-mono text-xs font-medium tracking-wider transition-all duration-200 ${
                    index === 0
                      ? "border-[#0050cc] bg-[#0050cc] text-white"
                      : "border-[#c5c6cd] bg-white text-[#44474d] hover:border-[#0050cc] hover:text-[#0050cc]"
                  }`}
                >
                  {filter}
                </button>
              ))}

            </div>

          </div>

        </section>

        {/* =====================================================
            PROJECTS
        ====================================================== */}

        <section className="px-4 py-16 md:px-16 md:py-20">

          <div className="mx-auto max-w-7xl">

            {/* Section heading */}

            <div className="mb-10">

              <p className="font-mono text-xs font-medium tracking-[0.12em] text-[#0050cc]">
                SELECTED PROJECTS
              </p>

              <h2 className="mt-3 font-[Manrope] text-3xl font-bold tracking-tight text-[#000] md:text-4xl">
                Built for Critical Operations
              </h2>

            </div>

            {/* =================================================
                FEATURED PROJECT
            ================================================== */}

            <article className="group mb-6 overflow-hidden rounded-lg border border-[#c5c6cd] bg-white transition-all duration-300 hover:border-[#0050cc] hover:shadow-xl">

              <div className="grid grid-cols-1 lg:grid-cols-2">

                {/* Image */}

                <div className="relative h-[350px] overflow-hidden md:h-[450px]">

                  <img
                    src={projects[0].image}
                    alt={projects[0].title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1c32]/80 via-transparent to-transparent" />

                  <div className="absolute bottom-0 left-0 p-6 text-white md:p-8">

                    <p className="mb-2 font-mono text-xs tracking-[0.15em] opacity-80">
                      FEATURED PROJECT
                    </p>

                    <p className="font-mono text-xs tracking-[0.15em] text-[#b4ebff]">
                      {projects[0].category}
                    </p>

                  </div>

                </div>

                {/* Content */}

                <div className="flex flex-col justify-center p-7 md:p-10">

                  <div className="mb-5 flex items-center gap-3">

                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d6e3ff] text-xl text-[#0050cc]">
                      ⚡
                    </span>

                    <span className="font-mono text-xs font-medium tracking-[0.12em] text-[#0050cc]">
                      DATA CENTER
                    </span>

                  </div>

                  <h3 className="font-[Manrope] text-3xl font-bold leading-tight text-[#000] md:text-4xl">
                    {projects[0].title}
                  </h3>

                  <p className="mt-5 leading-8 text-[#44474d]">
                    {projects[0].description}
                  </p>

                  {/* Project information */}

                  <div className="mt-7 grid grid-cols-2 gap-4 border-y border-[#e0e3e5] py-5">

                    <div>

                      <p className="font-mono text-[11px] tracking-widest text-[#75777e]">
                        LOCATION
                      </p>

                      <p className="mt-1 font-semibold text-[#0d1c32]">
                        {projects[0].location}
                      </p>

                    </div>

                    <div>

                      <p className="font-mono text-[11px] tracking-widest text-[#75777e]">
                        APPLICATION
                      </p>

                      <p className="mt-1 font-semibold text-[#0d1c32]">
                        Critical Power
                      </p>

                    </div>

                  </div>

                  <Link
                    to="/project-gallery"
                    className="mt-7 inline-flex w-fit items-center gap-2 rounded border border-[#0050cc] px-5 py-3 font-semibold text-[#0050cc] transition-all hover:bg-[#0050cc] hover:text-white"
                  >
                    View Project Gallery
                    <span>→</span>
                  </Link>

                </div>

              </div>

            </article>

            {/* =================================================
                PROJECT GRID
            ================================================== */}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              {projects.slice(1).map((project) => (

                <article
                  key={project.title}
                  className="group overflow-hidden rounded-lg border border-[#c5c6cd] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#0050cc] hover:shadow-lg"
                >

                  {/* Image */}

                  <div className="relative h-[280px] overflow-hidden">

                    <img
                      src={project.image}
                      alt={project.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d1c32]/90 via-transparent to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">

                      <p className="mb-2 font-mono text-xs tracking-[0.15em] text-[#b4ebff]">
                        {project.category}
                      </p>

                      <h3 className="font-[Manrope] text-2xl font-bold">
                        {project.title}
                      </h3>

                    </div>

                  </div>

                  {/* Content */}

                  <div className="p-6">

                    <p className="leading-7 text-[#44474d]">
                      {project.description}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-[#e0e3e5] pt-4">

                      <span className="font-mono text-xs text-[#75777e]">
                        📍 {project.location}
                      </span>

                      <Link
                        to="/project-gallery"
                        className="font-semibold text-[#0050cc] hover:underline"
                      >
                        View Project →
                      </Link>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          </div>

        </section>

        {/* =====================================================
            AMC SECTION
        ====================================================== */}

        <section className="border-y border-[#c5c6cd] bg-[#f2f4f6] px-4 py-16 md:px-16 md:py-20">

          <div className="mx-auto max-w-7xl">

            <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-[#c5c6cd] bg-white lg:grid-cols-3">

              {/* Left */}

              <div className="relative h-[300px] lg:h-[380px]">

                <img
                  src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80"
                  alt="Industrial electrical equipment"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1c32]/70 to-transparent" />

                <div className="absolute bottom-5 left-5">

                  <p className="font-mono text-xs tracking-widest text-[#b4ebff]">
                    SERVICE
                  </p>

                  <p className="mt-1 font-[Manrope] text-xl font-bold text-white">
                    Preventive Maintenance
                  </p>

                </div>

              </div>

              {/* Right */}

              <div className="flex flex-col justify-center p-8 lg:col-span-2 lg:p-10">

                <div className="mb-4 flex items-center gap-3">

                  <span className="text-2xl text-[#0050cc]">
                    ⚙
                  </span>

                  <span className="font-mono text-xs font-bold tracking-[0.15em] text-[#0050cc]">
                    ONGOING AMC
                  </span>

                </div>

                <h2 className="font-[Manrope] text-2xl font-bold text-[#000] md:text-3xl">
                  Comprehensive Power Maintenance for Tech Park
                </h2>

                <p className="mt-4 max-w-3xl leading-8 text-[#44474d]">
                  Managing installed UPS capacity across a large technology
                  campus with preventive maintenance, monitoring and dedicated
                  service support to help maintain reliable power continuity.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-5 border-y border-[#e0e3e5] py-5 md:grid-cols-3">

                  <div>

                    <p className="font-mono text-[11px] tracking-widest text-[#75777e]">
                      SERVICE
                    </p>

                    <p className="mt-1 font-semibold">
                      AMC
                    </p>

                  </div>

                  <div>

                    <p className="font-mono text-[11px] tracking-widest text-[#75777e]">
                      SUPPORT
                    </p>

                    <p className="mt-1 font-semibold">
                      24/7
                    </p>

                  </div>

                  <div>

                    <p className="font-mono text-[11px] tracking-widest text-[#75777e]">
                      MONITORING
                    </p>

                    <p className="mt-1 font-semibold">
                      Predictive
                    </p>

                  </div>

                </div>

                <Link
                  to="/services"
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded bg-[#0050cc] px-6 py-3 font-semibold text-white transition hover:bg-[#003b99]"
                >
                  Explore Service Solutions
                  <span>→</span>
                </Link>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            CTA
        ====================================================== */}

        <section className="px-4 py-16 md:px-16 md:py-20">

          <div className="mx-auto max-w-7xl">

            <div className="relative overflow-hidden rounded-lg bg-[#0d1c32] p-8 text-white md:p-12">

              {/* Pattern */}

              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(#b4ebff 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              <div className="relative z-10 grid grid-cols-1 items-center gap-8 md:grid-cols-2">

                <div>

                  <p className="font-mono text-xs tracking-[0.15em] text-[#b4ebff]">
                    START YOUR PROJECT
                  </p>

                  <h2 className="mt-3 max-w-2xl font-[Manrope] text-3xl font-bold leading-tight md:text-4xl">
                    Need a Custom Power Solution?
                  </h2>

                  <p className="mt-4 max-w-2xl leading-7 text-[#d8dadc]">
                    Talk directly with our engineering team to design
                    infrastructure that meets your exact load and uptime
                    requirements.
                  </p>

                </div>

                <div className="md:text-right">

                  <Link
                    to="/quote"
                    className="inline-flex items-center gap-2 rounded bg-[#0050cc] px-7 py-3 font-semibold text-white transition hover:bg-[#0266ff]"
                  >
                    Talk to an Expert
                    <span>→</span>
                  </Link>

                </div>

              </div>

            </div>

          </div>

        </section>

      </main>
    </>
  );
}