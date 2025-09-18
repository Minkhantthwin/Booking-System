-- DropForeignKey
ALTER TABLE "public"."Availability" DROP CONSTRAINT "Availability_resource_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."BlockedSlot" DROP CONSTRAINT "BlockedSlot_resource_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_resource_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Booking" DROP CONSTRAINT "Booking_service_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."Availability" ADD CONSTRAINT "Availability_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."Resource"("resource_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BlockedSlot" ADD CONSTRAINT "BlockedSlot_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."Resource"("resource_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."Service"("service_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."Resource"("resource_id") ON DELETE CASCADE ON UPDATE CASCADE;
