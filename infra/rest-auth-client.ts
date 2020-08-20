import { BaseUrl, RESTClient } from '../infra/angular2-rest';
import { Router } from '@angular/router';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { AuthHolderService } from '../services/auth-holder.service';
import { CommonServiceDependencies } from './common-service-dependencies';
import { ErrorService } from '../services/error.service';
import { ToastyService } from 'ngx-toasty';
import { ResourceWithPermissions } from '../models/resource-with-permissions.model';
import { Page } from '../models/page.model';
import { PermissionsModel } from '../models/permissions-bearer.model';
import { isArray as _isArray } from 'lodash';
import { LoaderService } from '../services/loader.service';
import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { TokenService } from '../services/token.service';
import { Idle } from 'idlejs/dist';

@Injectable()
@BaseUrl(environment.url)
export class RESTAuthClient extends RESTClient {
    authHolderService: AuthHolderService;
    router: Router;
    errorService: ErrorService;
    private toastyService: ToastyService;
    private loaderService: LoaderService;
    private tokenService: TokenService;

    constructor(commonDependencies: CommonServiceDependencies) {
        super(commonDependencies.http);
        this.authHolderService = commonDependencies.authHolderService;
        this.router = commonDependencies.router;
        this.errorService = commonDependencies.errorService;
        this.toastyService = commonDependencies.toastyService;
        this.loaderService = commonDependencies.loaderService;
        this.tokenService = commonDependencies.tokenService;
    }
    protected responseInterceptor(response: HttpResponse<any>, req: HttpRequest<any>): any {

        try {
            const json = response as any;
            if (response['refresh-token'] && response['refresh-token'] !== '') {
                localStorage.setItem('refresh-token', response['refresh-token']);
            }
            if (this.isResourceWithPermissions(json)) {
                return PermissionsModel.fromResource(json as ResourceWithPermissions<any>);
            } else if (this.isArrayOfResourcesWithPermissions(json)) {
                return PermissionsModel.fromResourceArray(json as ResourceWithPermissions<any>[]);
            } else if (this.isPageOfResourcesWithPermissions(json)) {
                return PermissionsModel.fromResourcePage(json as Page<ResourceWithPermissions<any>>);
            }
            return json;
        } catch (err) {
            return response;
        }
    }

    private isResourceWithPermissions(json: any): boolean {
        return json.payload !== undefined && json.editable !== undefined;
    }

    private isArrayOfResourcesWithPermissions(json: any): boolean {
        return _isArray(json) && json.length > 0 && this.isResourceWithPermissions(json[0]);
    }

    private isPageOfResourcesWithPermissions(json: any) {
        return this.isArrayOfResourcesWithPermissions(json.content);
    }

    protected responseErrorInterceptor(err: HttpResponse<any>, req: HttpRequest<any>, errorMessageKeyPrefix: string): HttpResponse<any> {
        this.showError(err, errorMessageKeyPrefix, req.url, err);
        return super.responseErrorInterceptor(err, req, errorMessageKeyPrefix);
    }

    protected showError(error, prefix?: string, reqUrl?: string, resp?: HttpResponse<any>) {
        this.errorService.getErrorMessage(error, prefix).subscribe(errorMessage => {
            const errorCaptureLink = '';
            if (resp.status !== 401 && resp.status !== 403 && resp.status !== 404) {
                this.errorService.recordErrorInSession(resp);
                const elem = document.getElementById('btnErr');
                if (elem) {
                    elem.parentNode.removeChild(elem);
                }
            }

            if (error.error) {
                if (error.error.fieldErrors) {
                    let realMSG = '';
                    const errorMSG = error.error.fieldErrors;
                    if (error.error.fieldErrors.orderProductCannotDeleted) {
                        this.toastyService.error(error.error.fieldErrors.orderProductCannotDeleted);
                    } else if (error.error.fieldErrors.id) {
                        this.toastyService.error(error.error.fieldErrors.id);
                    } else if (error.error.fieldErrors.name) {
                        this.toastyService.error(error.error.fieldErrors.name);
                    } else if (error.error.fieldErrors.file) {
                        this.toastyService.error(error.error.fieldErrors.file);
                    } else {
                        // tslint:disable-next-line: forin
                        for (const x in errorMSG) {
                            realMSG = errorMSG[x];
                            break;
                        }
                        if (realMSG !== 'No statistics found for the Datacenter' &&
                            (
                                !(realMSG.indexOf('Data collection job for VM') > -1) &&
                                !(realMSG.indexOf(' is in progress') > -1)
                            )
                        ) {
                            this.toastyService.error(realMSG);
                        }
                    }
                } else if (error.error === 'Invalid Access') {
                    if (location.href.indexOf('/datacenter-list') !== -1
                        && location.href.indexOf('/dashboard') !== -1) {
                        this.toastyService.error('Invalid Access -');
                        this.loaderService.hide();
                        this.authHolderService.logoutFromAllAuth();
                        location.href = '/datacenter-list';
                    } else {                       
                        this.authHolderService.logoutFromAllAuth();
                        this.toastyService.error('Invalid Access -');
                        this.loaderService.hide();
                        this.loaderService.hide();
                        location.href = '/datacenter-list';
                    }
                } else {
                    this.saveErrorLog(error);
                    this.loaderService.hide();
                    // const allError = ': ' + error.error;
                    if (error.status === 504) {
                        this.toastyService.error('Request has timed out.');
                    } else if (resp.status === 500) {
                        // this.toastyService.error('All Error-1:' + allError);
                        if (error.error.status && error.error.status !== '' && typeof (error.error.status) === 'string') {
                            const message500 = (error.error.status).replace(/_/g, ' ');
                            this.toastyService.error(message500 + errorCaptureLink);
                        } else {
                            this.toastyService.error('An error has occured, report has been submitted to administrator.');
                        }
                    } else if (typeof (error.error) === 'string' && error.error.length < 200) {
                        // this.toastyService.error('All Error-2:' + allError);
                        this.toastyService.error(error.error + errorCaptureLink);
                    } else {
                        if (error.error.status && error.error.status !== '' && typeof (error.error.status) === 'string') {
                            const message500 = (error.error.status).replace(/_/g, ' ');
                            this.toastyService.error(message500 + errorCaptureLink);
                            // this.toastyService.error('All Error-3:' + allError);
                        } else if (error.error.defaultMessage && error.error.defaultMessage !== ''
                            && typeof (error.error.defaultMessage) === 'string') {
                            const defaultMessage = (error.error.defaultMessage).replace(/_/g, ' ');
                            this.toastyService.error(defaultMessage + errorCaptureLink);
                            // this.toastyService.error('All Error-4:' + allError);
                        } else if (error.error.errors && error.error.errors.length && error.error.errors[0].defaultMessage !== ''
                            && typeof (error.error.errors[0].defaultMessage) === 'string') {
                            this.toastyService.error(error.error.errors[0].defaultMessage + errorCaptureLink);
                            // this.toastyService.error('All Error-5:' + allError);
                        } else {
                            if ((error.message).indexOf('api/security/auth/signin: 403 OK') > -1) {
                                // this.toastyService.error('All Error-6:' + allError);
                                this.toastyService.error('Please enter a valid email address and password' + errorCaptureLink);
                            } else if ((error.message).indexOf('.pdf: 404 OK') > -1) {
                                // this.toastyService.error('All Error-6B:' + allError);
                                this.toastyService.error('No Such File Exist' + errorCaptureLink);
                            } else if ((error.message).indexOf(': 0 Unknown Error') > -1
                                && error.name === 'HttpErrorResponse'
                                && error.ok === false
                                && error.status === 0
                                && error.statusText === 'Unknown Error'
                                && location.href.indexOf('?rid=') === -1
                            ) {
                                const idle3 = new Idle()
                                    // .whenNotInteractive()
                                    // .within(5)
                                    .do(() => {
                                        // print consol log('IDLE 3');
                                    })
                                    .start();
                                // alert('open the debugger - part-1 ')
                                // alert('open the debugger - part-2 ')
                                // debugger;
                                // this.toastyService.info('System was idle, please wait while refresh the page.');
                                // this.loaderService.hide();
                                // window.open((window.location.href).split('?')[0] + '?rid=1', '_self');
                                location.href = '/datacenter-list?rid=1';
                                // tslint:disable-next-line: deprecation
                                // window.location.reload(true);
                            } else if ((error.message).indexOf(': 0 Unknown Error') > -1
                                && error.name === 'HttpErrorResponse'
                                && error.ok === false
                                && error.status === 0
                                && error.statusText === 'Unknown Error'
                                && location.href.indexOf('?rid=') !== -1
                            ) {
                                if (location.href.indexOf('/datacenter-list') !== -1
                                    && location.href.indexOf('/dashboard') !== -1) {
                                    this.toastyService.error('Invalid Access -');
                                    this.loaderService.hide();
                                    this.authHolderService.logoutFromAllAuth();
                                    location.href = '/datacenter-list';
                                } else {
                                    this.authHolderService.logoutFromAllAuth();
                                    this.toastyService.error('Invalid Access -');
                                    this.loaderService.hide();
                                    this.loaderService.hide();
                                    location.href = '/datacenter-list';
                                }
                            } else {
                                if (error.error.size) {
                                    this.toastyService.error('No Such File Exist' + errorCaptureLink);
                                } else if (error.error.isTrusted
                                    && error.error.total === 0
                                    && error.error.type === 'error'
                                    && !error.error.bubbles
                                    && !error.error.composed) {
                                    this.authHolderService.logoutFromAllAuth();
                                    this.loaderService.hide();
                                    this.router.navigate(['/login']);
                                } else {
                                    // this.toastyService.error('All Error-7:' + JSON.stringify(error.error));
                                    this.toastyService.error(
                                        'An error has occured, report has been submitted to administrator.' + errorCaptureLink);
                                }
                            }
                        }
                    }
                }
            } else {
                if (error.status === 401 || error.status === 403) {
                    this.toastyService.error('Access denied');
                    this.saveErrorLog(error);
                    return false;
                }
                if (error.message !== 'Cannot read property \'length\' of null') {
                    if ((error.message).indexOf('inspected token doesn\'t appear to be a JWT') > -1) {
                        this.authHolderService.logoutFromAllAuth();
                        this.loaderService.hide();
                    } else {
                        // this.toastyService.error('All Error-8:' + JSON.stringify(error));
                        this.toastyService.error(error.message + errorCaptureLink);
                    }
                }
            }
        });
    }

    saveErrorLog(error) {
        error.headers = '';
        const errorData = JSON.stringify(error);
        this.tokenService.saveErrorLogAfterTokenget(errorData).subscribe(() => {
            // test
        });
    }
}
