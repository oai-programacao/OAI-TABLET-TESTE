import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
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
    canActivate: [AuthGuard],
  },
  {
    path: 'plans',
    loadComponent: () =>
      import('./components/viewplan/viewplan.component').then(
        (m) => m.ViewplanComponent
      ),
    canActivate: [AuthGuard],
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
    loadComponent: () =>
      import('./components/upload-pictures/upload-pictures.component').then(
        (m) => m.UploadPicturesComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'info/:clienteId',
    loadComponent: () =>
      import('./components/info-client/info-client.component').then(
        (m) => m.InfoClientComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'add-contract',
    loadComponent: () =>
      import('./components/add-contract/add-contract.component').then(
        (m) => m.AddContractComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'client-contracts/:clientId',
    loadComponent: () =>
      import('./components/client-contract/client-contract.component').then(
        (m) => m.ClientContractComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'address-transfer',
    loadComponent: () =>
      import('./components/address-transfer/address-transfer.component').then(
        (m) => m.AddressTransferComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'waiting-leads',
    loadComponent: () =>
      import('./components/waiting-leads/waiting-leads.component').then(
        (m) => m.WaitingLeadsComponent
      ),
    canActivate: [AuthGuard],
  },
];
