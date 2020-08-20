import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Application } from '../../../../models/application.model';
import { ApplicationGroupService } from '../application-group.service';
import { ApplicationCreateUpdateRequest, ApplicationService } from '../application.service';
import { DataTableSharedService } from './../../../../shared/data-table/data-table.service';
import { TitleService } from 'src/app/titleservice.service';
import { ToastyService } from 'ngx-toasty';
import { C3ValidatorPattern } from 'src/app/shared/c3-validator-pattern-class';
import { cvalidate } from './urlvalidate';

@Component({ templateUrl: './dz-edit-application.component.html' })
export class DzEditApplicationComponent {
  public application: Application;
  form: FormGroup;

  constructor(
    public applicationService: ApplicationService,
    public applicationGroupService: ApplicationGroupService,
    public formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private title: TitleService,
    public toastyService: ToastyService,
    private dataService: DataTableSharedService) {
    this.title.setTitle(`Applications`);
    this.initForm();
    this.route.params
      .subscribe(param => {
        if (this.dataService.getRowData && param.id) {
          this.application = this.dataService.getRowData;
          this.initForm();
        } else if (param.id) {
          this.redirectToParent();
        } else {
          this.initForm();
        }
      });
  }

  initForm() {
    this.form = this.formBuilder.group({
      name: [this.application && this.application.name, [Validators.required, Validators.maxLength(255)]],
      description: [this.application && this.application.description, [Validators.maxLength(255)]],
      url: [this.application && this.application.url,
      [Validators.required, Validators.maxLength(255), cvalidate]],
      horizon: [this.application ? this.application.horizon : false],
      applicationGroups: [this.application && this.application.applicationGroups]
    });
  }

  get url() { return this.form.get('url'); }

  save() {
    const form = this.form.value;
    const createUpdateRequest: ApplicationCreateUpdateRequest = {
      name: form.name,
      description: form.description,
      url: form.url,
      horizon: form.horizon,
      applicationGroupIds: form.applicationGroups.map(org => org.id)
    };
    const request$: Observable<Application> = this.application
      ? this.applicationService.updateApplication(this.application.id, createUpdateRequest)
      : this.applicationService.saveApplication(createUpdateRequest);

    request$.spinner().subscribe(app => {
      this.toastyService.success('Record Saved Successfully!!');
      return this.redirectToParent();
    }); // this.dialogRef.close(app));
  }

  redirectToParent() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
