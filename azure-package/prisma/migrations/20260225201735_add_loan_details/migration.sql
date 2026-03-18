-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "loan_balance" TEXT,
ADD COLUMN     "monthly_repayment" TEXT,
ADD COLUMN     "no_of_months" INTEGER,
ADD COLUMN     "start_date" TIMESTAMP(3);
