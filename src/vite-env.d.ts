/// <reference types="vite/client" />

// leaflet fix
import "leaflet"
declare module "leaflet" {
  namespace Icon {
    interface Default {
      _getIconUrl?: () => string;
    }
  }
}