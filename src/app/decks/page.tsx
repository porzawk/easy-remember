import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DeckManager } from "@/components/DeckManager";

export default async function DecksPage() {
  const session = await auth();

  const decks = await prisma.deck.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { vocabs: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">หมวดคำศัพท์</h1>
        <p className="text-white/70">
          จัดกลุ่มคำตามบริบท เช่น เกม หนัง หรือคำใช้บ่อย แล้วทบทวนแยกหมวดได้
        </p>
      </div>

      <DeckManager
        initialDecks={decks.map((d) => ({
          id: d.id,
          name: d.name,
          emoji: d.emoji,
          count: d._count.vocabs,
        }))}
      />
    </div>
  );
}
