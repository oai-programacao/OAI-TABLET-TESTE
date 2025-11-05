import { UploadPicturesComponent } from './components/upload-pictures/upload-pictures.component';
import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
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
    canActivate: [AuthGuard],
  },
  {
    path: 'upload-pictures/:clientId',
    loadComponent: () =>
      import('./components/upload-pictures/upload-pictures.component').then(
        (m) => m.UploadPicturesComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'pictures-client/:clientId',
    loadComponent: () =>
      import('./components/pictures-client/pictures-client.component').then(
        (m) => m.PicturesClientComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'info/:clientId',
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
  {
    path: 'alter-dateexpired',
    loadComponent: () =>
      import(
        './components/alter-date-expired/alter-date-expired.component'
      ).then((m) => m.AlterDateExpiredComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'attendances/:clientId',
    loadComponent: () =>
      import(
        './components/attendances-client/attendances-client.component'
      ).then((m) => m.AttendancesClientComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'transfer-ownership/:clientId/:contractId',
    loadComponent: () =>
      import(
        './components/transfer-ownership/transfer-ownership.component'
      ).then((m) => m.TransferOwnershipComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'upgrade-downgrade/:clientId/:action/:contractId',
    loadComponent: () =>
      import('./components/down-upgrade/down-upgrade.component').then(
        (m) => m.DownUpgradeComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'conclude',
    loadComponent: () =>
      import('./components/sales-panel/sales-panel.component').then(
        (m) => m.ConcludeSaleComponent
      ),
    canActivate: [AuthGuard],
  },
];
