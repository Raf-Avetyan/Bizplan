-- Store account-scoped mobile app state that should follow the user across devices.
CREATE TABLE "user_app_data" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "settings" JSONB DEFAULT '{}',
    "aiChats" JSONB DEFAULT '{}',
    "toolDocuments" JSONB DEFAULT '[]',
    "newsCache" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_app_data_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_app_data_userId_key" ON "user_app_data"("userId");

ALTER TABLE "user_app_data"
ADD CONSTRAINT "user_app_data_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
