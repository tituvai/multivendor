import VendorLayoutClient from "@/components/vendors/Vendorlayoutclient";

export default function VendorLayout({ children }) {
    return (
        <VendorLayoutClient>
            {children}
        </VendorLayoutClient>
        
      );
}