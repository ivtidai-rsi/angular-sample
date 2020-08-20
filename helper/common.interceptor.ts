import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { tap, mergeMap } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';
import { AuthHolderService } from '../services/auth-holder.service';
import { TokenService } from '../services/token.service';
import { UserProfileService } from '../services/user-profile.service';
import { ActivatedRoute } from '@angular/router';

@Injectable()
export class CommonInterceptor implements HttpInterceptor {
    ignoreResources: string[] = ['.jpg', '.png', '.jpeg', 'ps1.google.com', '.json'];
    ignoreAuthUrl: string[] = ['security/auth/', 'security/common'];
    byPassUrlGuestWithoutToken: string[] = ['maildeliverable'];
    token = '';
    refreshToken = '';
    guestToken = '';
    newToken = '';
    maintoken = '';

    constructor(
        private route: ActivatedRoute,
        private loaderService: LoaderService,
        private authHolder: AuthHolderService,
        private tokenService: TokenService,
        private userService: UserProfileService,
    ) {
        this.token = this.authHolder.getJwtToken();
        this.newToken = localStorage.getItem('newToken') ? localStorage.getItem('newToken') : '';
        this.refreshToken = localStorage.getItem('refresh-token') ? localStorage.getItem('refresh-token') : '';
        this.guestToken = this.route.snapshot.queryParams.token ? this.route.snapshot.queryParams.token : '';
        this.maintoken = localStorage.getItem('maintoken');
    }

    findArray(arr, str = location.href) {
        if (arr.length < 1 || (str === null || str === undefined || str === '')) { return false; }
        for (const element of arr) {
            if (str.search(element) > -1) {
                return true;
            }
        }
        return false;
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.newToken = localStorage.getItem('newToken') ? localStorage.getItem('newToken') : '';
        if (!this.findArray(this.ignoreResources, request.url) && !this.findArray(this.ignoreResources)) {
            this.showLoader();
            let clone: HttpRequest<any>;
            if (this.findArray(this.byPassUrlGuestWithoutToken)) {
                this.maintoken = localStorage.getItem('maintoken');
                if ((request.url).indexOf('/api/security/user/loggedIn') !== -1
                    && this.maintoken !== null
                    && this.maintoken !== ''
                    && this.maintoken !== undefined) {
                    clone = request.clone({
                        setHeaders: {
                            'X-Access-Token': this.maintoken,
                            'X-Language': 'en-US',
                            'X-Request-Type': 'GUEST',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                        }
                    });
                } else
                    if (this.findArray(this.byPassUrlGuestWithParamToken, request.url)) {
                        this.guestToken = this.route.snapshot.queryParams.token ? this.route.snapshot.queryParams.token : '';
                        clone = request.clone({
                            setHeaders: {
                                'X-Access-Token': this.guestToken,
                                'X-Language': 'en-US',
                                'X-Request-Type': 'GUEST',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                            }
                        });
                    } else {
                        clone = request.clone({
                            setHeaders: {
                                'X-Access-Token': this.newToken,
                                'X-Language': 'en-US',
                                'X-Request-Type': 'GUEST',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                            }
                        });
                    }

                // return next.handle(clone);
                return next.handle(clone).pipe(tap((event: HttpEvent<any>) => {
                    if (event instanceof HttpResponse) {
                        this.onEnd();
                    }
                }, (err) => {
                    this.onEnd();
                }));

            } else {
                if (
                    !this.authHolder.IsValidToken
                    && localStorage.getItem('refresh-token') !== undefined
                    && localStorage.getItem('refresh-token') !== ''
                    && localStorage.getItem('refresh-token') !== 'null'
                    && sessionStorage.getItem('ngx-webstorage|ngx-webstorage|authtoken') !== undefined
                    && sessionStorage.getItem('ngx-webstorage|ngx-webstorage|authtoken') !== ''
                    && sessionStorage.getItem('ngx-webstorage|ngx-webstorage|authtoken') !== 'null'
                    && !this.findArray(this.ignoreAuthUrl, request.url)
                ) {

                    if (!this.authHolder.IsValidRefreshToken) {
                        this.userService.removeUserDetails();
                    }

                    return this.tokenService.userGetNewToken()
                        .pipe(
                            mergeMap(res => {
                                if (res) {
                                    if (res.token && res.token !== null && res.token !== undefined) {
                                        this.authHolder.setJwtToken(res.token);
                                        localStorage.setItem('maintoken', res.token);
                                        if (res['refresh-token'] && res['refresh-token'] !== '') {
                                            localStorage.setItem('refresh-token', res['refresh-token']);
                                        }
                                        this.token = res.token;
                                        this.refreshToken = res['refresh-token'];
                                        clone = request.clone({
                                            setHeaders: {
                                                Authorization: 'Bearer ' + this.token,
                                                'Access-Control-Allow-Origin': '*',
                                                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
                                                'Accept-Language': 'en-US',
                                                // tslint:disable-next-line: max-line-length
                                                'refresh-token': (localStorage.getItem('refresh-token') ? localStorage.getItem('refresh-token') : '')
                                            }
                                        });

                                        return next.handle(clone).pipe(tap((event: HttpEvent<any>) => {
                                            if (event instanceof HttpResponse) {
                                                this.setScopedToken();
                                                this.onEnd();
                                            }
                                        }, (err) => {
                                            this.onEnd();
                                        }));

                                    }
                                }
                            }));

                } else {
                    if (request.url.indexOf('security/auth') < 1) {
                        this.token = this.authHolder.getJwtToken() !== '' ? (this.authHolder.getJwtToken()) : '';
                        this.refreshToken = localStorage.getItem('refresh-token') ? localStorage.getItem('refresh-token') : '';
                        clone = request.clone({
                            setHeaders: {
                                Authorization: 'Bearer ' + this.token,
                                'Accept-Language': 'en-US',
                                'refresh-token': this.refreshToken,
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                            }
                        });
                    } else {
                        clone = request.clone({
                            setHeaders: {
                                'Accept-Language': 'en-US',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                            }
                        });
                    }
                    if (
                        ((location.pathname).indexOf('login') === -1)
                        && ((location.pathname).indexOf('sign') === -1)
                        && ((location.pathname).indexOf('logout') === -1)
                        && ((location.pathname).indexOf('.') === -1)
                        && ((location.pathname).indexOf('auth') === -1)
                        && ((location.pathname).indexOf('maildeliverable') === -1)
                        && ((location.pathname).indexOf('confirm') === -1)
                        && ((location.pathname).indexOf('guest') === -1)
                        && ((location.pathname).indexOf('security') === -1)
                        && location.pathname !== ''
                        && location.pathname !== '/'
                    ) {
                        localStorage.setItem('lastVisitedUrl', (location.pathname));
                    }

                    // return next.handle(clone);
                    return next.handle(clone).pipe(tap((event: HttpEvent<any>) => {
                        if (event instanceof HttpResponse) {
                            this.onEnd();
                        }
                    }, (err) => {
                        this.onEnd();
                    }));
                }

            }

        } else {
            return next.handle(request).pipe(tap((event: HttpEvent<any>) => {
                // if (event instanceof HttpResponse) {
                // } else {
                // }
            }, (err) => {
                this.onEnd();
            }));
        }

    }

    setScopedToken() {
        const lastScopedToken = localStorage.getItem('lastScopedToken');
        if (lastScopedToken !== undefined && lastScopedToken !== null) {
            const lstJSON = JSON.parse(lastScopedToken);
            this.tokenService.enableScope(lstJSON).subscribe((res2) => {
                this.authHolder.setJwtToken(res2.token);
            });
        }
    }

    private onEnd(): void {
        this.hideLoader();
    }
    private showLoader(): void {
        this.loaderService.show();
    }
    private hideLoader(): void {
        this.loaderService.hide();
    }
}
