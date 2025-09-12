-- DropForeignKey
ALTER TABLE "public"."AuditLog" DROP CONSTRAINT "AuditLog_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Availability" DROP CONSTRAINT "Availability_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."BlockedSlot" DROP CONSTRAINT "BlockedSlot_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_staff_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Payment" DROP CONSTRAINT "Payment_booking_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."Availability" ADD CONSTRAINT "Availability_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlockedSlot" ADD CONSTRAINT "BlockedSlot_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."Booking"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
