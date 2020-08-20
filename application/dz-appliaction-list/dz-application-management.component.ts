import { Component, Input, OnInit } from '@angular/core';
import { AbstractManagementTableComponent } from 'src/app/shared/abstarct-management-table.component';

import { DzEditApplicationComponent } from '../dz-edit-application/dz-edit-application.component';
import { OrganizationService } from 'src/app/services/organization.service';
import { ApplicationService } from '../application.service';
import { ApplicationGroupService } from '../application-group.service';
import { AuthHolderService } from 'src/app/services/auth-holder.service';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { TitleService } from 'src/app/titleservice.service';
import { DataTableSharedService } from 'src/app/shared/data-table/data-table.service';
import { Permission } from 'src/app/models/permission.model';
import { PageRequest } from 'src/app/models/page-request.model';
import { Observable } from 'rxjs';
import { Page } from 'src/app/models/page.model';
import { Application } from 'src/app/models/application.model';
import { ToastyService } from 'ngx-toasty';
import { map } from 'rxjs/operators';
import { OrganizationCosmosService } from 'src/app/services/organization-cosmos.service';
import { MatSortable } from '@angular/material/sort';



@Component({
    selector: 'dz-application-management',
    templateUrl: './dz-application-management.component.html',
    styles: [`
    .height-zero{
        height: 0;
        visibility: hidden;
    }
    `]
}
)
export class DzApplicationManagementComponent extends AbstractManagementTableComponent<Application> implements OnInit {
    permission = Permission;
    @Input('has-dashboard') dashboardView = false;
    pageSize = 15;
    // columns = ['name', 'description', 'actions'];
    columns = ['name', 'description',  'horizon', 'applicationGroups', 'owner', 'actions'];
    protected editDialogComponent = DzEditApplicationComponent;
    readonly: boolean;
    constructor(public organizationService: OrganizationService,
        public applicationService: ApplicationService,
        public organizationService2: OrganizationCosmosService,
        public applicationGroupService: ApplicationGroupService,
        public auth: AuthHolderService,
        dialog: MatDialog,
        protected router: Router,
        public toastyService: ToastyService,
        private title: TitleService,
        protected route: ActivatedRoute,
        protected dataService: DataTableSharedService
    ) {
        super(dialog);
        this.title.setTitle(`Applications`);
    }

    ngOnInit() {
        if (this.dashboardView) {
            this.pageSize = 5;
            this.columns.splice(2);
        }
        this.sort.sort(<MatSortable>{
            id: 'id',
            start: 'desc'
        });
        super.ngOnInit();
    }

    organizationsSearchFunction = (name: string) => {
        let orFilter = {};
        if (name) {
            orFilter = { 'name': name, 'cid': name };
        }
        const filter = { orfilter: orFilter, andfilter: {}, ascSorting: ['name'], descSorting: [], pageNo: 1, recordsPerPage: 10000 };
        return this.organizationService2.getOrganizations(filter)
            .pipe(map(page => page.data));
    }



    protected getData(pageRequest: PageRequest, filters: any): Observable<Page<Application>> {
        if (!this.auth.hasPermission(Permission.READ_APPLICATIONS)) {
            this.totalElements = 0;
            return null;
        }
        return this.applicationService.getApplications(pageRequest, filters);

    }

    protected deleteElement(element: Application): Observable<any> {
        this.toastyService.success('Record deleted successfully!!');
        return this.applicationService.deleteApplication(element.id);
    }
}
