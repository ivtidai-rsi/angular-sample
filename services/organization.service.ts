import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Body, DELETE, GET, Path, POST } from '../infra/angular2-rest';
import { RESTAuthClient } from '../infra/rest-auth-client';
import { cityView, countryView, stateView } from '../models/address.model';
import { UserRole } from '../models/provisioning/provision-user-role.model';
import { Organization } from '../models/organization.model';
import { Sort } from '@angular/material/sort/sort';


@Injectable({
    providedIn: 'root',
})
export class OrganizationService extends RESTAuthClient {
    static readonly TicketingStates: string[] = [
        'ENABLED',
        'DISABLED',
        'READONLY'
    ];
    @POST('security/organizations/search')
    getOrganizations(@Body filter: any): Observable<any> {
        return null;
    }
    @POST('security/organizations/create')
    create(@Body organization: any): Observable<any> {
        return null;
    }
    @POST('security/organizations/update')
    update(@Body organization: any): Observable<any> {
        return null;
    }
    // All Country loads...
    @GET('security/common/list/country')
    getCountry(): Observable<countryView[]> {
        return null;
    }
    // All States loads on the basis of country Id...
    @GET('security/common/list/state/{countryId}')
    getState(@Path('countryId') countryId: number): Observable<stateView[]> {
        return null;
    }

    @GET('control-center/organizations/{id}')
    getOrganization(@Path('id') id: number): Observable<Organization> {
        return null;
    }


    @GET('security/common/list/city/{stateId}')
    getCity(@Path('stateId') stateId: number): Observable<cityView[]> {
        return null;
    }
    @POST('security/user/search/filter')
    getUsers(@Body filter: any): Observable<any> {
        return null;
    }
    @DELETE('security/organizations/delete/{id}')
    // @ErrorHandler("delete-user")
    deleteOrganization(@Path('id') id: number): Observable<any> {
        return null;
    }

    @GET('cosmos-portal/provisioning/get/roleUser/{orgId}')
    getRoleUser(@Path('orgId') orgId: number): Observable<UserRole> {
        return null;
    }
    orgnaizationToString = (org: any) => org && org.cid + ' - ' + org.name;

    // sortFun(sort?: Sort) {
    //     // tslint:disable-next-line: no-unused-expression
    //     sort && ((sort.direction ? 'asc' : 'desc'));
    // }

    organizationToString(org) {
        return org.cid + ' - ' + org.name;
    }
}

