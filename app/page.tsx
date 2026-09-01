import Link from "next/link";
import { cookies } from "next/headers";
import {
  getCampaign,
  activeWeek,
  shabbosOfWeek,
  formatShabbosDate,
  weekNumber,
} from "@/lib/campaign";
import { lastShabbosWeek } from "@/lib/household";
import { getCampaignStats } from "@/lib/stats";
import { raffleDraws } from "@/lib/raffle";
import { prisma } from "@/lib/db";
import { LogoOnDark, LinkLogoOnDark } from "@/components/Logo";
import { shul, isAdasDeployment } from "@/lib/shul";
import JoinNudge from "@/components/JoinNudge";
import HomePopups from "@/components/HomePopups";

export const dynamic = "force-dynamic";

export default async function Home() {
  const campaign = await getCampaign();
  const week = activeWeek(campaign);
  const rawWeek = weekNumber(campaign);
  const stats = await getCampaignStats(week);
  const suggestions = await prisma.suggestion.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const started = rawWeek >= 1;
  const nextShabbos = shabbosOfWeek(campaign, week);
  const draws = await raffleDraws();
  const latestDraw = draws.length > 0 ? draws[draws.length - 1] : null;
  const myToken = (await cookies()).get("elul_token")?.value;
  const checkinHref = myToken ? `/c/${encodeURIComponent(myToken)}` : "/find";

  // Is a check-in window open (last Shabbos still accepting check-ins)?
  const DAY_MS = 24 * 60 * 60 * 1000;
  const lastWeek = lastShabbosWeek(campaign);
  
  // SAFEGUARD: Avoid calling .getTime() on an undefined date structure if lastWeek calculation returns 0 or empty
  const targetShabbosDate = lastWeek >= 1 ? shabbosOfWeek(campaign, lastWeek) : null;
  const checkinOpen =
    lastWeek >= 1 &&
    targetShabbosDate &&
    Date.now() - new Date(targetShabbosDate).getTime() <= 8 * DAY_MS;
    
  const lastLabel = lastWeek >= 1 && targetShabbosDate ? formatShabbosDate(targetShabbosDate) : "";

  // Known family with check-ins still waiting? Make it personal.
  let familyNudge: { name: string; waiting: number } | null = null;
  if (checkinOpen && myToken) {
    const hh = await prisma.household.findUnique({
      where: { token: myToken },
      include: { members: { include: { goals: { where: { week: lastWeek } } } } },
    });
    if (hh) {
      const waiting = hh.members.reduce(
        (n, m) => n + m.goals.filter((g) => !g.checkedInAt).length,
        0
      );
      if (waiting > 0) {
        familyNudge = { name: hh.familyName ?? "Your", waiting };
      }
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-navy text-cream relative overflow-hidden">
        <div className="glow-dot absolute -top-24 right-0 h-96 w-96 rounded-full" />
        <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20 relative">
          <div className="mb-6 flex items-center gap-5">
            <LogoOnDark className="h-14 w-auto" />
            {shul.partnerName && (
              <>
                <span className="h-12 w-px bg-cream/25" aria-hidden />
                <LinkLogoOnDark className="h-12 w-auto" />
              </>
            )}
          </div>
          <p className="text-gold-soft font-display tracking-widest uppercase text-sm mb-4">
            Elul 5786 &middot; A campaign of {shul.name}
            {shul.partnerName ? ` & ${shul.partnerName}` : ""}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl leading-tight mb-6">
            One small thing for Shabbos.
            <br />
            Every week of Elul.
          </h1>
          <p className="text-cream/85 text-lg max-w-xl mb-8">
            Every man, woman, and child takes on one extra way to honor
            Shabbos, held for the four Shabbosos through Shabbos Shuva. Learn
            at the table, set it Thursday night, sing the zemiros. Small
            commitments, taken on together.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {checkinOpen ? (
              <>
                <Link
                  href={checkinHref}
                  className="bg-gold text-navy-deep font-semibold rounded-lg px-8 py-3.5 text-center text-lg hover:bg-gold-soft transition-colors"
                >
                  ✓ Check in for Shabbos {lastLabel}
                </Link>
                <Link
                  href="/signup"
                  className="border border-cream/40 rounded-lg px-8 py-3.5 text-center text-lg hover:border-gold-soft hover:text-gold-soft transition-colors"
                >
                  Sign up to join
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="bg-gold text-navy-deep font-semibold rounded-lg px-8 py-3.5 text-center text-lg hover:bg-gold-soft transition-colors"
                >
                  Sign up to join
                </Link>
                <Link
                  href={checkinHref}
                  className="border border-cream/40 rounded-lg px-8 py-3.5 text-center text-lg hover:border-gold-soft hover:text-gold-soft transition-colors"
                >
                  Check in for this week
                </Link>
              </>
            )}
          </div>
          <p className="mt-6 text-cream/60 text-sm">
            {started && nextShabbos ? (
              <>Week {week} of {campaign.weeks} &middot; Shabbos {formatShabbosDate(nextShabbos)}</>
            ) : (
              <>Campaign begins the week of {formatShabbosDate(shabbosOfWeek(campaign, 1))}</>
            )}
          </p>
        </div>
      </section>

      {/* Personal check-in nudge */}
      {familyNudge && (
        <section className="bg-gold border-b border-gold-soft">
          <Link
            href={checkinHref}
            className="block mx-auto max-w-3xl px-4 py-4 text-navy-deep hover:opacity-90 transition-opacity"
          >
            <p className="text-center font-medium">
              🔔 <span className="font-bold">The {familyNudge.name} Family:</span>{" "}
              {familyNudge.waiting} check-in{familyNudge.waiting === 1 ? "" : "s"} still
              waiting for Shabbos {lastLabel} —{" "}
              <span className="underline underline-offset-2 font-bold">
                tap here, it takes 10 seconds →
              </span>
            </p>
          </Link>
        </section>
      )}

      {/* Pledge banner */}
      <section className="bg-gold-pale border-y border-gold/30">
        <div className="mx-auto max-w-3xl px-4 py-5 text-center">
          <p className="text-navy-deep">
            <span className="font-semibold">
              ${stats.pledgeTotal.toLocaleString()}
            </span>{" "}
            pledged so far to <span className="font-semibold">{stats.charityName}</span> —
            ${campaign.pledgePerSignup} for every family that signs up.
          </p>
        </div>
      </section>

      {/* Pizza raffle winner */}
      {latestDraw && (
        <section className="mx-auto max-w-3xl px-4 pt-10">
          <div className="bg-white rounded-2xl border border-gold/40 shadow-sm px-6 py-5 text-center">
            <p className="text-navy">
              🍕 Mazeltov to the{" "}
              <span className="font-display text-lg text-navy-deep font-semibold">
                {latestDraw.familyName}
              </span>{" "}
              family on winning this week&rsquo;s pizza raffle! Your family
              could be next! Check in after Shabbos if you completed what
              you took on — and be automatically entered into next
              week&rsquo;s raffle!
            </p>
          </div>
        </section>
      )}

      {/* Why we're doing this */}
      <section className="mx-auto max-w-3xl px-4 pt-10 pb-16">
        <details className="group bg-white rounded-2xl border border-parchment shadow-sm">
          <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between gap-3">
            <span className="font-display text-xl sm:text-2xl text-navy">
              Why we&rsquo;re doing this
            </span>
            <span className="text-gold text-xl transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="px-6 pb-6 text-ink-soft leading-relaxed space-y-4 border-t border-parchment pt-5">
            <p>
              By taking on one dedicated resolution for Shabbos, we collectively elevate the environment of our homes and our community during this auspicious time of the year.
            </p>
          </div>
        </details>
      </section>
    </div>
  );
}
