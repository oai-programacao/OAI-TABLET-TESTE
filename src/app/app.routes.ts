import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./components/searchclient/searchclient.component').then(
        (m) => m.SearchclientComponent
      ),
  },
  {
    path: 'plans',
    loadComponent: () =>
      import('./components/viewplan/viewplan.component').then(
        (m) => m.ViewplanComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/registerclient/registerclient.component').then(
        (m) => m.RegisterclientComponent
      ),
  },
  {
    path: 'upload-pictures',
    loadComponent: () => import('./components/upload-pictures/upload-pictures.component').then(
      (m) => m.UploadPicturesComponent
    )
  },
  {
    path: 'info',
    loadComponent: () => import('./components/info-client/info-client.component').then((m) => m.InfoClientComponent)
  },
  {
    path: 'add-contract',
    loadComponent: () => import('./components/add-contract/add-contract.component').then((m) => m.AddContractComponent)
  },
  {
    path: 'client-contract',
    loadComponent: () => import('./components/client-contract/client-contract.component').then((m) => m.ClientContractComponent)
  },
  {
    path: 'address-transfer',
    loadComponent: () => import ('./components/address-transfer/address-transfer.component').then((m) => m.AddressTransferComponent)
  }
];
