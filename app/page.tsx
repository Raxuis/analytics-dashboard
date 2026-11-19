import PassportExperience from "@/components/passport/PassportExperience";
import { passportMetadata } from "@/i18n/metadata";
export const metadata = passportMetadata("fr");
export default function Home() { return <PassportExperience />; }
