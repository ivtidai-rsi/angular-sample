import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DzApplicationManagementComponent } from './dz-application-management.component';
import { SharedMatModule } from 'src/app/shared/shared-mat.module';
import { DzControlsModule } from 'src/app/dz-controls/dz-controls.module';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TabedListModule } from 'src/app/common/tabed-list/tabed-list.module';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: DzApplicationManagementComponent
  }
];

@NgModule({
  declarations: [DzApplicationManagementComponent],
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
  exports: [DzApplicationManagementComponent]
})
export class DzAppliactionManagementModule { }
