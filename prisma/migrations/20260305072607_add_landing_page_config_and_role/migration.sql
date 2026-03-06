-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'content_manager';

-- CreateTable
CREATE TABLE "landing_page_configs" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "hero_title" TEXT NOT NULL DEFAULT 'Solusi Terpercaya untuk Analisis Kimia & Lingkungan',
    "hero_description" TEXT NOT NULL DEFAULT 'WahfaLab menyediakan layanan laboratorium profesional dengan akurasi tinggi dan hasil yang cepat. Mendukung kebutuhan industri Anda dengan standar internasional.',
    "hero_image_url" TEXT,
    "hero_cta_text" TEXT NOT NULL DEFAULT 'Mulai Penawaran',
    "hero_cta_link" TEXT NOT NULL DEFAULT '/login',
    "features" JSONB DEFAULT '[{"icon": "ShieldCheck", "title": "Terakreditasi", "description": "Metode pengujian kami sesuai dengan standar regulasi nasional dan internasional (ISO/IEC 17025)."}, {"icon": "Clock", "title": "Hasil Cepat", "description": "Kami memahami urgensi bisnis Anda. Proses analisis dilakukan secara efisien tanpa mengurangi akurasi."}, {"icon": "Beaker", "title": "Layanan Lengkap", "description": "Mulai dari pengujian air, udara, tanah, hingga kalibrasi alat industri di satu tempat."}]',
    "portfolio" JSONB DEFAULT '[]',
    "legal_content" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "contact_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_page_configs_pkey" PRIMARY KEY ("id")
);
