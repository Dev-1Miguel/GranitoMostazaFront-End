import { HttpInterceptorFn } from "@angular/common/http";

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof localStorage === "undefined") {
    return next(req);
  }

  const serializedSession = localStorage.getItem("authSession");

  if (!serializedSession) {
    return next(req);
  }

  try {
    const session = JSON.parse(serializedSession) as { token?: string };

    if (!session.token) {
      return next(req);
    }

    return next(
      req.clone({
        setHeaders: {
          Authorization: `Bearer ${session.token}`,
        },
      })
    );
  } catch {
    return next(req);
  }
};
