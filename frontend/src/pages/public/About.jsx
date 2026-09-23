import { Link } from "react-router-dom";

const timeline = [
  {
    year: "Foundation",
    title: "Built on Reliability",
    text: "SKYTECH ELECTRICALS was established with a focus on dependable electrical engineering and power solutions.",
  },
  {
    year: "Technical Expertise",
    title: "Engineering Excellence",
    text: "Our technical capabilities expanded across UPS systems, batteries, voltage stabilizers and industrial power infrastructure.",
  },
  {
    year: "Industrial Projects",
    title: "Growing Project Experience",
    text: "We developed experience delivering reliable power solutions for demanding industrial and commercial environments.",
  },
  {
    year: "Expanded Support",
    title: "Service & Maintenance",
    text: "Our support capabilities grew to provide dependable service, maintenance and customer assistance.",
  },
  {
    year: "Complete Solutions",
    title: "Powering Modern Business",
    text: "Today, SKYTECH ELECTRICALS provides complete power solutions designed around reliability, performance and continuity.",
  },
];

export default function About() {
  return (
    <main className="bg-[#f7f9fb] text-[#0d1c32]">

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0d1c32] px-6 py-24 text-white md:px-16 md:py-32">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#3cd7ff]">
            ABOUT SKYTECH ELECTRICALS
          </p>

          <h1 className="max-w-4xl font-sans text-4xl font-extrabold leading-tight md:text-6xl">
            Powering Businesses
            <br />
            With Reliability
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
            Delivering precision electrical engineering and robust
            infrastructure solutions for modern industrial demands. We build
            the backbone of tomorrow&apos;s industrial power.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/projects"
              className="bg-[#0266ff] px-7 py-4 font-semibold text-white transition hover:bg-[#0050cc]"
            >
              Our Projects →
            </Link>

            <Link
              to="/contact"
              className="border border-white/40 px-7 py-4 font-semibold text-white transition hover:bg-white hover:text-[#0d1c32]"
            >
              Contact Engineering
            </Link>
          </div>
        </div>
      </section>

      {/* COMPANY STORY */}
      <section className="px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0050cc]">
              COMPANY STORY
            </p>

            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Engineering Power That Businesses Can Depend On
            </h2>
          </div>

          <div className="space-y-6 text-base leading-8 text-[#44474d]">
            <p>
              SKYTECH ELECTRICALS focuses on delivering dependable power
              infrastructure for businesses and industrial environments where
              continuity and performance matter.
            </p>

            <p>
              From power protection and voltage stabilization to batteries and
              service support, our approach is centered around practical
              engineering and reliable execution.
            </p>
          </div>
        </div>
      </section>

      {/* QUALITY / VISION / MISSION */}
      <section className="bg-white px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">

          <article className="border border-[#c5c6cd] p-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#0050cc]">
              QUALITY
            </p>

            <h3 className="mt-4 text-2xl font-bold">
              Quality Driven
            </h3>

            <p className="mt-5 leading-7 text-[#44474d]">
              We focus on engineering precision, dependable equipment and
              consistent execution across our power solutions.
            </p>

            <div className="mt-8 border-t border-[#c5c6cd] pt-5 font-mono text-xs font-bold uppercase tracking-wider">
              ISO 9001:2015 CERTIFIED
            </div>
          </article>

          <article className="border border-[#c5c6cd] p-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#0050cc]">
              VISION
            </p>

            <h3 className="mt-4 text-2xl font-bold">
              Reliable Industrial Power
            </h3>

            <p className="mt-5 leading-7 text-[#44474d]">
              To contribute to reliable and efficient industrial
              infrastructure through dependable electrical power solutions.
            </p>
          </article>

          <article className="border border-[#c5c6cd] p-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#0050cc]">
              MISSION
            </p>

            <h3 className="mt-4 text-2xl font-bold">
              Customer-Focused Engineering
            </h3>

            <p className="mt-5 leading-7 text-[#44474d]">
              To provide practical, reliable and service-oriented power
              solutions that support our customers&apos; operational needs.
            </p>
          </article>

        </div>
      </section>

      {/* TIMELINE */}
      <section className="px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0050cc]">
            OUR JOURNEY
          </p>

          <h2 className="mt-4 text-3xl font-bold md:text-4xl">
            Building Expertise Over Time
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-5">
            {timeline.map((item, index) => (
              <article
                key={item.year}
                className="relative border-t-4 border-[#0266ff] bg-white p-6 shadow-sm"
              >
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#0050cc]">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <p className="mt-5 text-sm font-bold">
                  {item.year}
                </p>

                <h3 className="mt-3 text-xl font-bold">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm leading-6 text-[#44474d]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0d1c32] px-6 py-20 text-white md:px-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#3cd7ff]">
              WORK WITH US
            </p>

            <h2 className="mt-4 text-3xl font-bold md:text-4xl">
              Let&apos;s Build Reliable Power Infrastructure.
            </h2>
          </div>

          <Link
            to="/quote"
            className="shrink-0 bg-[#0266ff] px-8 py-4 font-semibold text-white hover:bg-[#0050cc]"
          >
            Get a Quote →
          </Link>
        </div>
      </section>

    </main>
  );
}