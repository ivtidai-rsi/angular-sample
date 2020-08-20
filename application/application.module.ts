import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedMatModule } from 'src/app/shared/shared-mat.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { DzEditApplicationComponent } from './dz-edit-application/dz-edit-application.component';

import { NgScrollbarModule } from 'ngx-scrollbar';

import { DzControlsModule } from 'src/app/dz-controls/dz-controls.module';
import { ApplicationViewComponent } from './application-view.component';
import { TabedListModule } from '../../../common/tabed-list/tabed-list.module';
import { FlexLayoutModule } from '@angular/flex-layout';

const routes: Routes = [
  {
    path: '', component: ApplicationViewComponent,
    children: [
      {
        path: 'configure',
        loadChildren: () => {
          return import('./dz-appliaction-list/dz-appliaction-management.module').then(module => module.DzAppliactionManagementModule);
        }
     },
     {
      path: 'configure/:id', component: DzEditApplicationComponent
    },
     {
       path: 'provision', component: DzEditApplicationComponent
     },
     {
       path: '', redirectTo: 'configure'
     }
    ]
  }
];

@NgModule({
  declarations: [
    DzEditApplicationComponent,
    ApplicationViewComponent
  ],
  imports: [
    CommonModule,
    SharedMatModule,
    DzControlsModule,
    FormsModule,
    ReactiveFormsModule,
    NgScrollbarModule,
    FlexLayoutModule,
    TabedListModule,
    RouterModule.forChild(routes)
  ],
  entryComponents: [DzEditApplicationComponent]
})
export class ApplicationModule { }
