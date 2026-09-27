-- CreateTable
CREATE TABLE `bookshelf` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `work_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `author` VARCHAR(191) NULL,
    `cover_id` INTEGER NULL,
    `description` TEXT NULL,
    `page_count` INTEGER NULL,
    `published_year` INTEGER NULL,
    `subjects` JSON NULL,
    `status` ENUM('WANT_TO_READ', 'READING', 'COMPLETED') NOT NULL DEFAULT 'WANT_TO_READ',
    `current_page` INTEGER NOT NULL DEFAULT 0,
    `rating` INTEGER NULL,
    `note` VARCHAR(1000) NULL,
    `started_at` DATETIME(3) NULL,
    `finished_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bookshelf_work_id_key`(`work_id`),
    INDEX `bookshelf_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
