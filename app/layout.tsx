import type { Metadata } from "next";
import {pageMetadata,siteDescription,siteOrigin} from "@/lib/seo";
import "./growth.css";
import "./jashntoons.css";
import "./cinema.css";
import "./worlds.css";
import "./full-films.css";
import "./showcase.css";
import "./packages.css";
import "./editor.css";
import "./editor-guided.css";
import "./homepage.css";
import "./custom-film.css";
import "./reel-library.css";
import "./studio-assets.css";
import "./homepage-cinematic.css";
import "./creator-simple.css";
import "./mobile-refinements.css";
import "./occasion-collection.css";
import "./ai-moments.css";
import "./voice-studio.css";
import "./creation-portal.css";
import "./creative-suite.css";
import "./live-style.css";
import "./creator-community.css";
import "./completed-library.css";
import "./icon-system.css";
import "./reference-creation.css";
import "./ai-motion.css";
import "./invitation-studio.css";
import "./home-workbench.css";
import "./film-experience.css";
import "./creation-workbench.css";
import "./editor-workbench.css";
import "./reels-viewer.css";

export const metadata: Metadata = {
  ...pageMetadata("AI Invitation Maker — 2 Free Reel Credits | Jashntoons",siteDescription,"/"),
  metadataBase: new URL(siteOrigin),
  applicationName: "Jashntoons",
  robots: {index:true,follow:true,googleBot:{index:true,follow:true,"max-video-preview":-1,"max-image-preview":"large","max-snippet":-1}},
  description: siteDescription,
  icons: {
    icon: [{url:"/favicon.svg",type:"image/svg+xml"},{url:"/favicon-32.png",type:"image/png",sizes:"32x32"}],
    apple: [{url:"/apple-touch-icon.png",sizes:"180x180",type:"image/png"}],
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
