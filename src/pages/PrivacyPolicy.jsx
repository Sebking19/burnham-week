const SECTIONS = [
  {
    title: "What this app is",
    body: "This app is an information hub for Burnham Week. It shows the race and social programme, weather and tide information, official notices and links to the published regatta documents.",
  },
  {
    title: "What we store",
    body: "When you sign in we store your name and email address so we know who you are, plus anything you choose to add to your profile such as your boat name and whether you sail as helm or crew. Your accessibility settings are kept on your own device only.",
  },
  {
    title: "How we use it",
    body: "Your details are used only to run the app: to show your name against notices you post, and to let organisers see who is using the app. We do not sell your information and we do not use it for advertising.",
  },
  {
    title: "Weather and tides",
    body: "Forecast and tide information is fetched from public marine weather services. No personal information is sent when the forecast is loaded.",
  },
  {
    title: "Who can see your details",
    body: "Organisers with admin access can see the list of app users and their email addresses. Other members only see your name where you have posted something.",
  },
  {
    title: "Your choices",
    body: "You can update or clear your profile details at any time on the Profile page. If you would like your account removed altogether, contact an organiser using the numbers on the Help page and we will delete it.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-[#1B2A5B]">Privacy Policy</h1>
        <p className="text-lg text-[#141B34]/70 mt-1">Burnham Week app — last updated August 2026</p>
      </div>

      {SECTIONS.map((s) => (
        <section key={s.title} className="bg-white border-2 border-dotted border-[#141B34]/40 rounded-2xl p-6">
          <h2 className="font-display text-2xl text-[#1B2A5B]">{s.title}</h2>
          <p className="text-lg text-[#141B34]/85 mt-2 leading-relaxed">{s.body}</p>
        </section>
      ))}
    </div>
  );
}