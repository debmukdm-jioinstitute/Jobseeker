// Browser-only, loaded on click. Builds the PDF in memory and downloads it; nothing is stored.
import type { Cv } from "@/lib/cv";
import type { Profile } from "@/lib/profile";

export async function buildCv(cv: Cv, p: Profile): Promise<Blob> {
  const { Document, Page, Text, View, StyleSheet, pdf } = await import("@react-pdf/renderer");
  const st = StyleSheet.create({
    page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.35 }, name: { fontSize: 20, fontFamily: "Helvetica-Bold" },
    contact: { color: "#555", marginTop: 2, marginBottom: 8 }, h: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 3, borderBottomWidth: 0.5, borderBottomColor: "#999" },
    t: { fontFamily: "Helvetica-Bold", marginTop: 3 }, b: { marginLeft: 10 },
  });
  const contact = [p.phone, p.city, p.linkedin_url, p.portfolio_url].filter(Boolean).join("  |  ");
  const Entries = ({ title, es }: { title: string; es: Cv["experience"] }) =>
    es.length ? (<View><Text style={st.h}>{title}</Text>{es.map((e, i) => (<View key={i} wrap={false}>{e.title ? <Text style={st.t}>{e.title}</Text> : null}{e.bullets.map((b, j) => <Text key={j} style={st.b}>•  {b}</Text>)}</View>))}</View>) : null;
  const doc = (
    <Document title={`${p.full_name} CV`} author={p.full_name}>
      <Page size="A4" style={st.page}>
        <Text style={st.name}>{p.full_name}</Text>
        <Text style={st.contact}>{contact}</Text>
        {cv.summary ? <View><Text style={st.h}>Summary</Text><Text>{cv.summary}</Text></View> : null}
        {cv.skills.length ? <View><Text style={st.h}>Skills</Text><Text>{cv.skills.join(", ")}</Text></View> : null}
        <Entries title="Experience" es={cv.experience} />
        <Entries title="Projects" es={cv.projects} />
        {cv.education.length ? <View><Text style={st.h}>Education</Text>{cv.education.map((e, i) => <Text key={i}>{e}</Text>)}</View> : null}
      </Page>
    </Document>
  );
  return pdf(doc).toBlob();
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const downloadCv = async (cv: Cv, p: Profile, filename: string) => saveBlob(await buildCv(cv, p), filename);
