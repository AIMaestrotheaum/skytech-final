import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

const products = [
  {
    title: "Online UPS Systems",
    category: "UPS",
    icon: "⚡",
    description:
      "High-performance online UPS systems designed to provide uninterrupted, reliable power for critical business and industrial applications.",
    features: [
      "Double-conversion technology",
      "High efficiency",
      "Zero transfer time",
      "Advanced monitoring",
    ],
  },
  {
    title: "Servo Voltage Stabilizers",
    category: "VOLTAGE STABILIZATION",
    icon: "◈",
    description:
      "Precision voltage stabilization solutions that protect sensitive electrical equipment from voltage fluctuations.",
    features: [
      "High voltage accuracy",
      "Fast correction",
      "Industrial applications",
      "Protection against fluctuations",
    ],
  },
  {
    title: "Lithium-ion Battery Systems",
    category: "BATTERY",
    icon: "▣",
    description:
      "Modern lithium-ion battery solutions providing dependable backup power with high energy density and long service life.",
    features: [
      "High energy density",
      "Long operating life",
      "Low maintenance",
      "Battery monitoring",
    ],
  },
  {
    title: "Tubular Battery Systems",
    category: "BATTERY",
    icon: "▤",
    description:
      "Reliable tubular battery systems engineered for backup power applications requiring dependable performance.",
    features: [
      "Long backup capability",
      "Low maintenance",
      "Deep discharge performance",
      "Industrial applications",
    ],
  },
  {
    title: "Three Phase UPS",
    category: "UPS",
    icon: "△",
    description:
      "Three-phase UPS systems designed for large industrial loads, data centers and mission-critical infrastructure.",
    features: [
      "Three-phase input and output",
      "Scalable capacity",
      "Advanced protection",
      "Critical-load support",
    ],
  },
  {
    title: "Industrial Power Solutions",
    category: "POWER INFRASTRUCTURE",
    icon: "⚙",
    description:
      "Integrated power infrastructure solutions engineered around the specific requirements of industrial facilities.",
    features: [
      "Load assessment",
      "System design",
      "Installation support",
      "Maintenance services",
    ],
  },
];

export default function Products() {
  const navigate = useNavigate();
  const navigatingRef = useRef(false);

  useEffect(() => {
    navigatingRef.current = false;

    let timeoutId = null;

    const navigateWithTransition = (target) => {
      if (navigatingRef.current) {
        return;
      }

      navigatingRef.current = true;

      timeoutId = window.setTimeout(() => {
        navigate(target);
      }, 400);
    };

    /*
     * =========================================================
     * SCROLL TO BOTTOM
     * Products → Services
     * =========================================================
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

      const reachedBottom =
        scrollTop + viewportHeight >=
        documentHeight - 30;

      if (reachedBottom) {
        navigateWithTransition("/services");
      }
    };

    /*
     * =========================================================
     * SCROLL UP AT TOP
     * Products → About
     * =========================================================
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
        navigateWithTransition("/about");
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    window.addEventListener("wheel", handleWheel, {
      passive: true,
    });

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      window.removeEventListener(
        "wheel",
        handleWheel
      );

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="border-b border-[#c5c6cd] px-4 py-16 md:px-16 md:py-20">
        <div className="mx-auto max-w-7xl">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#d6e3ff] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-[#0050cc]" />

            <span className="font-mono text-xs font-medium tracking-widest text-[#0d1c32]">
              POWER PRODUCTS
            </span>
          </div>

          <h1 className="max-w-4xl font-[Manrope] text-4xl font-extrabold leading-tight tracking-tight text-[#000] md:text-5xl">
            Reliable Power.
            <br />

            <span className="text-[#0050cc]">
              Engineered for Performance.
            </span>
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#44474d]">
            Explore our range of UPS, battery, voltage stabilization and
            industrial power solutions engineered for businesses that cannot
            afford downtime.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">

            <Link
              to="/quote"
              className="rounded bg-[#0050cc] px-7 py-3 font-semibold text-white transition hover:bg-[#003b99]"
            >
              Get a Quote
            </Link>

            <Link
              to="/contact"
              className="rounded border border-[#75777e] bg-white px-7 py-3 font-semibold text-[#0d1c32] transition hover:border-[#0050cc] hover:text-[#0050cc]"
            >
              Talk to an Expert
            </Link>

          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCT GRID
      ===================================================== */}

      <section className="px-4 py-16 md:px-16 md:py-20">
        <div className="mx-auto max-w-7xl">

          <div className="mb-10">

            <p className="font-mono text-xs font-medium tracking-widest text-[#0050cc]">
              OUR PRODUCTS
            </p>

            <h2 className="mt-3 font-[Manrope] text-3xl font-bold text-[#000] md:text-4xl">
              Complete Power Portfolio
            </h2>

            <p className="mt-3 max-w-2xl text-[#44474d]">
              Solutions designed for reliable power protection, voltage
              regulation and energy continuity.
            </p>

          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

            {products.map((product) => (

              <article
                key={product.title}
                className="group flex flex-col rounded-lg border border-[#c5c6cd] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#0050cc] hover:shadow-lg"
              >

                {/* ICON */}

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-[#d6e3ff] text-2xl text-[#0050cc]">
                  {product.icon}
                </div>

                {/* CATEGORY */}

                <p className="font-mono text-xs font-medium tracking-widest text-[#0050cc]">
                  {product.category}
                </p>

                {/* TITLE */}

                <h3 className="mt-3 font-[Manrope] text-2xl font-bold text-[#000]">
                  {product.title}
                </h3>

                {/* DESCRIPTION */}

                <p className="mt-4 leading-7 text-[#44474d]">
                  {product.description}
                </p>

                {/* FEATURES */}

                <div className="mt-6 border-t border-[#e0e3e5] pt-5">

                  <p className="mb-3 font-mono text-xs font-medium tracking-widest text-[#44474d]">
                    KEY FEATURES
                  </p>

                  <ul className="space-y-2">

                    {product.features.map((feature) => (

                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-[#44474d]"
                      >

                        <span className="mt-1 text-[#0050cc]">
                          ✓
                        </span>

                        <span>
                          {feature}
                        </span>

                      </li>

                    ))}

                  </ul>

                </div>

                {/* BUTTON */}

                <Link
                  to="/quote"
                  className="mt-7 inline-flex w-fit items-center font-semibold text-[#0050cc] transition hover:gap-2"
                >
                  Enquire Now →
                </Link>

              </article>

            ))}

          </div>

        </div>
      </section>

      {/* =====================================================
          WHY SKYTECH
      ===================================================== */}

      <section className="border-y border-[#c5c6cd] bg-white px-4 py-16 md:px-16 md:py-20">
        <div className="mx-auto max-w-7xl">

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">

            <div className="text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d6e3ff] text-2xl text-[#0050cc]">
                ✓
              </div>

              <h3 className="font-[Manrope] text-lg font-bold">
                Reliable
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#44474d]">
                Engineered for dependable power protection.
              </p>

            </div>

            <div className="text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d6e3ff] text-2xl text-[#0050cc]">
                ⚡
              </div>

              <h3 className="font-[Manrope] text-lg font-bold">
                High Performance
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#44474d]">
                Designed for demanding electrical environments.
              </p>

            </div>

            <div className="text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d6e3ff] text-2xl text-[#0050cc]">
                ⚙
              </div>

              <h3 className="font-[Manrope] text-lg font-bold">
                Engineering
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#44474d]">
                Solutions built around your power requirements.
              </p>

            </div>

            <div className="text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d6e3ff] text-2xl text-[#0050cc]">
                24
              </div>

              <h3 className="font-[Manrope] text-lg font-bold">
                Service Support
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#44474d]">
                Dedicated support for critical power systems.
              </p>

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="px-4 py-16 md:px-16">
        <div className="mx-auto max-w-7xl">

          <div className="rounded-lg bg-[#0d1c32] p-8 text-white md:p-12">

            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">

              <div>

                <p className="font-mono text-xs tracking-widest text-[#b4ebff]">
                  NEED A POWER SOLUTION?
                </p>

                <h2 className="mt-3 font-[Manrope] text-3xl font-bold md:text-4xl">
                  Let's design the right solution for your facility.
                </h2>

                <p className="mt-4 max-w-xl leading-7 text-[#d8dadc]">
                  Share your power requirements with our engineering team and
                  receive a solution designed around your application.
                </p>

              </div>

              <div className="md:text-right">

                <Link
                  to="/quote"
                  className="inline-block rounded bg-[#0050cc] px-8 py-3 font-semibold text-white transition hover:bg-[#0266ff]"
                >
                  Request a Quote
                </Link>

              </div>

            </div>

          </div>

        </div>
      </section>

    </main>
  );
}