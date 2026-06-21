import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DeleteVocabButton } from "@/components/DeleteVocabButton";
import { SpeakButton } from "@/components/SpeakButton";

type Example = { en: string; th: string };

export default async function VocabDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const vocab = await prisma.vocab.findFirst({
    where: { id, userId: session!.user.id },
  });

  if (!vocab) notFound();

  const examples = (vocab.examples as unknown as Example[]) ?? [];

  return (
    <div className="space-y-6">
      <Link href="/words" className="text-sm text-white/60 hover:text-white">
        ← กลับคลังคำศัพท์
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl font-bold">{vocab.word}</h1>
          <SpeakButton text={vocab.word} label={`ฟังเสียงคำว่า ${vocab.word}`} size="md" />
          {vocab.partOfSpeech && (
            <span className="text-sm text-white/50">{vocab.partOfSpeech}</span>
          )}
          {vocab.pronunciation && (
            <span className="text-emerald-300">/{vocab.pronunciation}/</span>
          )}
        </div>

        <p className="mt-3 text-xl">{vocab.translation}</p>

        {examples.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-white/60">ประโยคตัวอย่าง</p>
            <ul className="space-y-2">
              {examples.map((ex, i) => (
                <li key={i} className="rounded-lg bg-black/20 p-3">
                  <div className="flex items-start gap-2">
                    <p className="flex-1">{ex.en}</p>
                    <SpeakButton text={ex.en} label="ฟังเสียงประโยคนี้" />
                  </div>
                  <p className="text-sm text-white/60">{ex.th}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {vocab.notes && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-white/60">ควรรู้เพิ่มเติม</p>
            <p className="mt-1 text-white/80">{vocab.notes}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-sm text-white/50">
          <span>ทบทวนไปแล้ว {vocab.reviewCount} ครั้ง</span>
          <span>เพิ่มเมื่อ {vocab.createdAt.toLocaleDateString("th-TH")}</span>
          {vocab.lastReviewedAt && (
            <span>ทบทวนล่าสุด {vocab.lastReviewedAt.toLocaleDateString("th-TH")}</span>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <DeleteVocabButton id={vocab.id} />
      </div>
    </div>
  );
}
