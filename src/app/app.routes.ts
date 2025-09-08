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
  }
];
