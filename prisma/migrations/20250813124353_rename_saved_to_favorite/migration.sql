/*
  Warnings:

  - You are about to drop the `Saved` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Saved" DROP CONSTRAINT "Saved_userId_fkey";

-- DropTable
DROP TABLE "public"."Saved";

-- CreateTable
CREATE TABLE "public"."Favorite" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "inputText" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "alt1" TEXT,
    "alt2" TEXT,
    "alt3" TEXT,
    "inputLang" TEXT NOT NULL,
    "outputLang" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
