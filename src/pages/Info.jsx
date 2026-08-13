import { Award, BarChart3, Mail, Receipt, Users } from "lucide-react";
import InfoSection from "@/components/info/InfoSection";
import LiveDocuments from "@/components/info/LiveDocuments";
import FleetList from "@/components/info/FleetList";
import LinkRow from "@/components/info/LinkRow";
import CoursesCard from "@/components/info/CoursesCard";
import SocialProgramme from "@/components/info/SocialProgramme";
import SponsorGrid from "@/components/info/SponsorGrid";

export default function Info() {
  return (
    <div>
      <h1 className="font-display text-3xl mb-1 text-[#1B2A5B] dark:text-[#8FAEF7]">Information</h1>
      <p className="text-[#141B34]/70 dark:text-white/70 mb-6">Burnham Week 2026 · Sat 29 Aug – Sun 5 Sep</p>

      <InfoSection title="Notice Board Documents">
        <LiveDocuments />
      </InfoSection>

      <InfoSection title="Courses">
        <CoursesCard />
      </InfoSection>

      <InfoSection title="Social Programme">
        <SocialProgramme />
      </InfoSection>

      <InfoSection title="Results & Standings">
        <LinkRow label="Race results" url="https://www.burnhamweek.com/race-results/" icon={BarChart3} />
        <LinkRow label="The Town Cup" url="https://www.burnhamweek.com/town-cup/" icon={Award} />
      </InfoSection>

      <InfoSection title="Racing Classes">
        <FleetList />
      </InfoSection>

      <InfoSection title="Our Sponsors">
        <SponsorGrid />
      </InfoSection>

      <InfoSection title="Visitors & Contact">
        <LinkRow label="Visitor information" url="https://www.burnhamweek.com/visitors/" icon={Users} />
        <LinkRow label="Entry fees 2026" url="https://www.burnhamweek.com/wp-content/uploads/2026/08/Burnham-Week-2026-Entry-Fees.pdf" icon={Receipt} />
        <LinkRow label="Get in touch with the organisers" url="https://www.burnhamweek.com/get-in-touch/" icon={Mail} />
      </InfoSection>

      <InfoSection title="Watching the Racing">
        <p>
          Most days the start line will be Pilehouse. It is well worth a walk downriver past the
          Royal Corinthian Yacht Club — a gentle 15 minute stroll lets you sit on the sea wall and
          watch the fleets lining up river, quite a spectacle of sail colours and manoeuvring.
        </p>
        <p>
          Races are started by the Committee Boat, recognisable by the large Burnham Week flag it
          displays.
        </p>
      </InfoSection>

      <InfoSection title="Ashore & Social">
        <p>
          All clubs will be open and serving refreshments during Burnham Week, with fantastic snacks
          and drinks, and balcony views of the boats heading to the start.
        </p>
        <p>
          In town you'll find The Lovely Shops boutique, the local cinema, riverside meals at the
          Quayside Bistro, and pubs along the front. On up-river racing days, walk the river path to
          Creeksea to watch the racing and stop at the Parlour Café on the way back.
        </p>
      </InfoSection>

      <InfoSection title="Bank Holiday Weekend">
        <p>
          All Bank Holiday weekend there is an exhibition in the Burnham Museum, on The Quay at the
          junction with Coronation Road. On Tuesday, the weekly Street Market takes place in the
          High Street.
        </p>
      </InfoSection>

      <InfoSection title="Final Saturday – Trophy Day">
        <p>
          Final races and prize giving at the Royal Burnham Yacht Club, including the presenting of
          the Town Cup. As dusk settles, the week is completed by the Burnham Week firework display,
          with great viewing all along the Quayside — supported by Burnham Week and Burnham Town
          Council.
        </p>
      </InfoSection>

      <InfoSection title="Entries">
        <p>
          Entry fees for 2026 are frozen at last year's prices. Enter online via the Burnham Week
          website — the entry process takes just a few clicks.
        </p>
        <a
          href="https://www.burnhamweek.com/enter-here/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 bg-[#4C7CF0] text-white px-6 py-3 rounded-lg text-lg font-bold hover:bg-[#3E6BDB]"
        >
          Enter Burnham Week 2026
        </a>
      </InfoSection>

      <p className="text-sm text-[#141B34]/60 dark:text-white/60 mb-4">
        Information sourced from burnhamweek.com. Always check the official notice board for the
        latest changes.
      </p>
    </div>
  );
}