import { Component, OnInit } from '@angular/core';
import { TabListItem } from 'src/app/models/tab-lists-dto';
import { ActivatedRoute } from '@angular/router';
import { AuthHolderService } from 'src/app/services/auth-holder.service';
import { Permission } from 'src/app/models/permission.model';

@Component({
  selector: 'app-application-view',
  templateUrl: './application-view.component.html'
})

export class ApplicationViewComponent implements OnInit {
  configPath: TabListItem[] = [];
  hasQueryParams = false;
  Permission = Permission;
  constructor(private activatedRoute: ActivatedRoute, public auth: AuthHolderService) { }

  ngOnInit() {

    const fromDashbaord = this.activatedRoute.snapshot.queryParams;

    this.configPath = [
      {
        labelName: 'Configure',
        path: './configure',
        isActive: ''
      },
      {
        labelName: 'Provision',
        path: './provision',
        isActive: ''
      }];

    if (fromDashbaord.navigation) {
      this.hasQueryParams = true;
    }
    if (!this.auth.hasPermission(Permission.WRITE_APPLICATIONS)) {
      this.configPath.splice(1, 1);
    }
  }



  goToBack() {
    window.history.back();
  }

}
