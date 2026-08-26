export interface paths {
    "/api/v1/catalog/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Категории каталога с числом активных товаров */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            slug: string;
                            name: {
                                ru: string;
                                kk: string;
                            };
                            description: {
                                ru: string | null;
                                kk: string | null;
                            };
                            image: {
                                id: string;
                                url: string;
                                width: number;
                                height: number;
                                lqip: string | null;
                                alt: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                            } | null;
                            productCount?: number;
                        }[];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/catalog/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Список товаров с фильтрами */
        get: {
            parameters: {
                query?: {
                    category?: string;
                    search?: string;
                    type?: "SIMPLE" | "BUNDLE";
                    featured?: boolean | string;
                    sort?: "default" | "price_asc" | "price_desc" | "name" | "new";
                    limit?: number;
                    offset?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            items: {
                                id: string;
                                slug: string;
                                /** @enum {string} */
                                type: "SIMPLE" | "BUNDLE";
                                name: {
                                    ru: string;
                                    kk: string;
                                };
                                short: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                                price: number;
                                compareAtPrice: number | null;
                                weight: {
                                    value: number;
                                    /** @enum {string} */
                                    unit: "G" | "ML" | "PORTION" | "PCS";
                                };
                                /** @enum {string} */
                                stockStatus: "IN_STOCK" | "LOW" | "OUT";
                                isFeatured: boolean;
                                category: {
                                    id: string;
                                    slug: string;
                                    name: {
                                        ru: string;
                                        kk: string;
                                    };
                                } | null;
                                badges: {
                                    code: string;
                                    label: {
                                        ru: string;
                                        kk: string;
                                    };
                                    /** @enum {string} */
                                    tone: "GOLD" | "TEAL" | "STONE";
                                    icon: string | null;
                                }[];
                                image: {
                                    id: string;
                                    url: string;
                                    width: number;
                                    height: number;
                                    lqip: string | null;
                                    alt: {
                                        ru: string | null;
                                        kk: string | null;
                                    };
                                } | null;
                            }[];
                            total: number;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/catalog/products/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Карточка товара: все фото, описание, состав набора */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    slug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            slug: string;
                            /** @enum {string} */
                            type: "SIMPLE" | "BUNDLE";
                            name: {
                                ru: string;
                                kk: string;
                            };
                            short: {
                                ru: string | null;
                                kk: string | null;
                            };
                            price: number;
                            compareAtPrice: number | null;
                            weight: {
                                value: number;
                                /** @enum {string} */
                                unit: "G" | "ML" | "PORTION" | "PCS";
                            };
                            /** @enum {string} */
                            stockStatus: "IN_STOCK" | "LOW" | "OUT";
                            isFeatured: boolean;
                            category: {
                                id: string;
                                slug: string;
                                name: {
                                    ru: string;
                                    kk: string;
                                };
                            } | null;
                            badges: {
                                code: string;
                                label: {
                                    ru: string;
                                    kk: string;
                                };
                                /** @enum {string} */
                                tone: "GOLD" | "TEAL" | "STONE";
                                icon: string | null;
                            }[];
                            image: {
                                id: string;
                                url: string;
                                width: number;
                                height: number;
                                lqip: string | null;
                                alt: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                            } | null;
                            description: {
                                ru: string | null;
                                kk: string | null;
                            };
                            seoTitle: {
                                ru: string | null;
                                kk: string | null;
                            };
                            seoDescription: {
                                ru: string | null;
                                kk: string | null;
                            };
                            images: {
                                id: string;
                                url: string;
                                width: number;
                                height: number;
                                lqip: string | null;
                                alt: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                            }[];
                            bundleItems: {
                                qty: number;
                                product: {
                                    id: string;
                                    slug: string;
                                    /** @enum {string} */
                                    type: "SIMPLE" | "BUNDLE";
                                    name: {
                                        ru: string;
                                        kk: string;
                                    };
                                    short: {
                                        ru: string | null;
                                        kk: string | null;
                                    };
                                    price: number;
                                    compareAtPrice: number | null;
                                    weight: {
                                        value: number;
                                        /** @enum {string} */
                                        unit: "G" | "ML" | "PORTION" | "PCS";
                                    };
                                    /** @enum {string} */
                                    stockStatus: "IN_STOCK" | "LOW" | "OUT";
                                    isFeatured: boolean;
                                    category: {
                                        id: string;
                                        slug: string;
                                        name: {
                                            ru: string;
                                            kk: string;
                                        };
                                    } | null;
                                    badges: {
                                        code: string;
                                        label: {
                                            ru: string;
                                            kk: string;
                                        };
                                        /** @enum {string} */
                                        tone: "GOLD" | "TEAL" | "STONE";
                                        icon: string | null;
                                    }[];
                                    image: {
                                        id: string;
                                        url: string;
                                        width: number;
                                        height: number;
                                        lqip: string | null;
                                        alt: {
                                            ru: string | null;
                                            kk: string | null;
                                        };
                                    } | null;
                                };
                            }[];
                            componentsTotal: number | null;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/catalog/collections/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Подборка товаров («Хиты», «Новинки» и т.д.) */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    slug: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            slug: string;
                            title: {
                                ru: string;
                                kk: string;
                            };
                            subtitle: {
                                ru: string | null;
                                kk: string | null;
                            };
                            products: {
                                id: string;
                                slug: string;
                                /** @enum {string} */
                                type: "SIMPLE" | "BUNDLE";
                                name: {
                                    ru: string;
                                    kk: string;
                                };
                                short: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                                price: number;
                                compareAtPrice: number | null;
                                weight: {
                                    value: number;
                                    /** @enum {string} */
                                    unit: "G" | "ML" | "PORTION" | "PCS";
                                };
                                /** @enum {string} */
                                stockStatus: "IN_STOCK" | "LOW" | "OUT";
                                isFeatured: boolean;
                                category: {
                                    id: string;
                                    slug: string;
                                    name: {
                                        ru: string;
                                        kk: string;
                                    };
                                } | null;
                                badges: {
                                    code: string;
                                    label: {
                                        ru: string;
                                        kk: string;
                                    };
                                    /** @enum {string} */
                                    tone: "GOLD" | "TEAL" | "STONE";
                                    icon: string | null;
                                }[];
                                image: {
                                    id: string;
                                    url: string;
                                    width: number;
                                    height: number;
                                    lqip: string | null;
                                    alt: {
                                        ru: string | null;
                                        kk: string | null;
                                    };
                                } | null;
                            }[];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/home": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Секции главной страницы и публичные настройки одним запросом */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            sections: {
                                id: string;
                                /** @enum {string} */
                                kind: "HERO" | "COLLECTION" | "BUNDLES" | "CATEGORIES" | "EDITORIAL" | "BANNER" | "STEPS" | "FAQ" | "CONTACTS";
                                payload: {
                                    [key: string]: unknown;
                                };
                                sortOrder: number;
                                products?: {
                                    id: string;
                                    slug: string;
                                    /** @enum {string} */
                                    type: "SIMPLE" | "BUNDLE";
                                    name: {
                                        ru: string;
                                        kk: string;
                                    };
                                    short: {
                                        ru: string | null;
                                        kk: string | null;
                                    };
                                    price: number;
                                    compareAtPrice: number | null;
                                    weight: {
                                        value: number;
                                        /** @enum {string} */
                                        unit: "G" | "ML" | "PORTION" | "PCS";
                                    };
                                    /** @enum {string} */
                                    stockStatus: "IN_STOCK" | "LOW" | "OUT";
                                    isFeatured: boolean;
                                    category: {
                                        id: string;
                                        slug: string;
                                        name: {
                                            ru: string;
                                            kk: string;
                                        };
                                    } | null;
                                    badges: {
                                        code: string;
                                        label: {
                                            ru: string;
                                            kk: string;
                                        };
                                        /** @enum {string} */
                                        tone: "GOLD" | "TEAL" | "STONE";
                                        icon: string | null;
                                    }[];
                                    image: {
                                        id: string;
                                        url: string;
                                        width: number;
                                        height: number;
                                        lqip: string | null;
                                        alt: {
                                            ru: string | null;
                                            kk: string | null;
                                        };
                                    } | null;
                                }[];
                            }[];
                            settings: {
                                contacts: {
                                    phone: string;
                                    whatsapp: string;
                                    telegram: string;
                                    instagram: string;
                                    email: string;
                                    address: {
                                        ru: string;
                                        kk: string;
                                    };
                                    workingHours: {
                                        ru: string;
                                        kk: string;
                                    };
                                };
                                delivery: {
                                    minOrder: number;
                                    baseFee: number;
                                    freeFrom: number | null;
                                    pickupAddress: {
                                        ru: string;
                                        kk: string;
                                    };
                                    note: {
                                        ru: string;
                                        kk: string;
                                    };
                                };
                                payment: {
                                    kaspiEnabled: boolean;
                                    kaspiLink: string;
                                    kaspiAmountManual: boolean;
                                    note: {
                                        ru: string;
                                        kk: string;
                                    };
                                };
                                brand: {
                                    name: string;
                                    tagline: {
                                        ru: string;
                                        kk: string;
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/settings/public": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Контакты, доставка, бренд — всё, что нужно шапке и подвалу */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            contacts: {
                                phone: string;
                                whatsapp: string;
                                telegram: string;
                                instagram: string;
                                email: string;
                                address: {
                                    ru: string;
                                    kk: string;
                                };
                                workingHours: {
                                    ru: string;
                                    kk: string;
                                };
                            };
                            delivery: {
                                minOrder: number;
                                baseFee: number;
                                freeFrom: number | null;
                                pickupAddress: {
                                    ru: string;
                                    kk: string;
                                };
                                note: {
                                    ru: string;
                                    kk: string;
                                };
                            };
                            payment: {
                                kaspiEnabled: boolean;
                                kaspiLink: string;
                                kaspiAmountManual: boolean;
                                note: {
                                    ru: string;
                                    kk: string;
                                };
                            };
                            brand: {
                                name: string;
                                tagline: {
                                    ru: string;
                                    kk: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Оформление заказа: сохраняет заявку и отдаёт ссылку в чат */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        customerName: string;
                        phone: string;
                        /**
                         * @default WHATSAPP
                         * @enum {string}
                         */
                        channel?: "WHATSAPP" | "TELEGRAM";
                        /**
                         * @default PERSON
                         * @enum {string}
                         */
                        customerType?: "PERSON" | "BUSINESS";
                        /**
                         * @default DELIVERY
                         * @enum {string}
                         */
                        deliveryType?: "DELIVERY" | "PICKUP";
                        address?: string;
                        comment?: string;
                        /**
                         * @default ru
                         * @enum {string}
                         */
                        locale?: "ru" | "kk";
                        items: {
                            productId: string;
                            qty: number;
                        }[];
                        website?: string;
                        /** @default false */
                        isTest?: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            number: string;
                            status: string;
                            subtotal: number;
                            deliveryFee: number;
                            total: number;
                            chatUrl: string;
                            message: string;
                            paymentUrl: string | null;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Сообщение с витрины: пожелание, отзыв или вопрос */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /**
                         * @default WISH
                         * @enum {string}
                         */
                        kind?: "WISH" | "REVIEW" | "QUESTION";
                        name: string;
                        contact?: string;
                        message: string;
                        /**
                         * @default ru
                         * @enum {string}
                         */
                        locale?: "ru" | "kk";
                        website?: string;
                        /** @default false */
                        isTest?: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            ok: boolean;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Вход в админку */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: email */
                        email: string;
                        password: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            accessToken: string;
                            user: {
                                id: string;
                                email: string;
                                name: string;
                                /** @enum {string} */
                                role: "OWNER" | "MANAGER" | "VIEWER";
                                prefs: {
                                    [key: string]: unknown;
                                };
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Обновление access-токена по refresh-cookie */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            accessToken: string;
                            user: {
                                id: string;
                                email: string;
                                name: string;
                                /** @enum {string} */
                                role: "OWNER" | "MANAGER" | "VIEWER";
                                prefs: {
                                    [key: string]: unknown;
                                };
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Выход: гасим refresh-токен */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            ok: boolean;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Текущий пользователь и его настройки рабочего места */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            email: string;
                            name: string;
                            /** @enum {string} */
                            role: "OWNER" | "MANAGER" | "VIEWER";
                            prefs: {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/auth/me/prefs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Сохранение настроек рабочего места (тема, плотность, дашборд, представления) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            prefs: {
                                [key: string]: unknown;
                            };
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/admin/media": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Медиатека */
        get: {
            parameters: {
                query?: {
                    limit?: number;
                    offset?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            items: {
                                id: string;
                                url: string;
                                width: number;
                                height: number;
                                bytes: number;
                                mime: string;
                                lqip: string | null;
                                originalName: string | null;
                                createdAt: string;
                                usageCount: number;
                            }[];
                            total: number;
                            storageEnabled: boolean;
                        };
                    };
                };
            };
        };
        put?: never;
        /** Загрузка фото: ресайз, WebP, LQIP и отправка в R2 */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            url: string;
                            width: number;
                            height: number;
                            bytes: number;
                            mime: string;
                            lqip: string | null;
                            originalName: string | null;
                            createdAt: string;
                            usageCount: number;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/media/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Удаление файла из медиатеки и из R2
         * @description Если фото где-то используется, запрос отклоняется и возвращает список мест. С force=true оно сначала отвязывается от товаров и категорий, а потом удаляется.
         */
        delete: {
            parameters: {
                query?: {
                    force?: boolean | string;
                };
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            ok: boolean;
                            detached: number;
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Товары для таблицы админки (включая скрытые) */
        get: {
            parameters: {
                query?: {
                    search?: string;
                    category?: string;
                    type?: "SIMPLE" | "BUNDLE";
                    status?: "active" | "hidden" | "out" | "nophoto";
                    limit?: number;
                    offset?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            items: {
                                id: string;
                                slug: string;
                                /** @enum {string} */
                                type: "SIMPLE" | "BUNDLE";
                                name: {
                                    ru: string;
                                    kk: string;
                                };
                                short: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                                price: number;
                                compareAtPrice: number | null;
                                weight: {
                                    value: number;
                                    /** @enum {string} */
                                    unit: "G" | "ML" | "PORTION" | "PCS";
                                };
                                /** @enum {string} */
                                stockStatus: "IN_STOCK" | "LOW" | "OUT";
                                isFeatured: boolean;
                                category: {
                                    id: string;
                                    slug: string;
                                    name: {
                                        ru: string;
                                        kk: string;
                                    };
                                } | null;
                                badges: {
                                    code: string;
                                    label: {
                                        ru: string;
                                        kk: string;
                                    };
                                    /** @enum {string} */
                                    tone: "GOLD" | "TEAL" | "STONE";
                                    icon: string | null;
                                }[];
                                image: {
                                    id: string;
                                    url: string;
                                    width: number;
                                    height: number;
                                    lqip: string | null;
                                    alt: {
                                        ru: string | null;
                                        kk: string | null;
                                    };
                                } | null;
                                description: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                                seoTitle: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                                seoDescription: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                                images: {
                                    id: string;
                                    url: string;
                                    width: number;
                                    height: number;
                                    lqip: string | null;
                                    alt: {
                                        ru: string | null;
                                        kk: string | null;
                                    };
                                }[];
                                bundleItems: {
                                    qty: number;
                                    product: {
                                        id: string;
                                        slug: string;
                                        /** @enum {string} */
                                        type: "SIMPLE" | "BUNDLE";
                                        name: {
                                            ru: string;
                                            kk: string;
                                        };
                                        short: {
                                            ru: string | null;
                                            kk: string | null;
                                        };
                                        price: number;
                                        compareAtPrice: number | null;
                                        weight: {
                                            value: number;
                                            /** @enum {string} */
                                            unit: "G" | "ML" | "PORTION" | "PCS";
                                        };
                                        /** @enum {string} */
                                        stockStatus: "IN_STOCK" | "LOW" | "OUT";
                                        isFeatured: boolean;
                                        category: {
                                            id: string;
                                            slug: string;
                                            name: {
                                                ru: string;
                                                kk: string;
                                            };
                                        } | null;
                                        badges: {
                                            code: string;
                                            label: {
                                                ru: string;
                                                kk: string;
                                            };
                                            /** @enum {string} */
                                            tone: "GOLD" | "TEAL" | "STONE";
                                            icon: string | null;
                                        }[];
                                        image: {
                                            id: string;
                                            url: string;
                                            width: number;
                                            height: number;
                                            lqip: string | null;
                                            alt: {
                                                ru: string | null;
                                                kk: string | null;
                                            };
                                        } | null;
                                    };
                                }[];
                                componentsTotal: number | null;
                                isActive: boolean;
                                sortOrder: number;
                                stockQty: number | null;
                                costPrice: number | null;
                                updatedAt: string;
                            }[];
                            total: number;
                        };
                    };
                };
            };
        };
        put?: never;
        /** Создание товара или набора */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        slug?: string;
                        /**
                         * @default SIMPLE
                         * @enum {string}
                         */
                        type?: "SIMPLE" | "BUNDLE";
                        nameRu: string;
                        nameKk: string;
                        shortRu?: string | null;
                        shortKk?: string | null;
                        descriptionRu?: string | null;
                        descriptionKk?: string | null;
                        price: number;
                        compareAtPrice?: number | null;
                        costPrice?: number | null;
                        weightValue: number;
                        /**
                         * @default G
                         * @enum {string}
                         */
                        weightUnit?: "G" | "ML" | "PORTION" | "PCS";
                        categoryId?: string | null;
                        /**
                         * @default IN_STOCK
                         * @enum {string}
                         */
                        stockStatus?: "IN_STOCK" | "LOW" | "OUT";
                        stockQty?: number | null;
                        /** @default true */
                        isActive?: boolean;
                        /** @default false */
                        isFeatured?: boolean;
                        /** @default 0 */
                        sortOrder?: number;
                        seoTitleRu?: string | null;
                        seoTitleKk?: string | null;
                        seoDescRu?: string | null;
                        seoDescKk?: string | null;
                        /** @default [] */
                        images?: {
                            assetId: string;
                            altRu?: string | null;
                            altKk?: string | null;
                        }[];
                        /** @default [] */
                        badgeCodes?: string[];
                        /** @default [] */
                        bundleItems?: {
                            componentId: string;
                            qty: number;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            slug: string;
                            /** @enum {string} */
                            type: "SIMPLE" | "BUNDLE";
                            name: {
                                ru: string;
                                kk: string;
                            };
                            short: {
                                ru: string | null;
                                kk: string | null;
                            };
                            price: number;
                            compareAtPrice: number | null;
                            weight: {
                                value: number;
                                /** @enum {string} */
                                unit: "G" | "ML" | "PORTION" | "PCS";
                            };
                            /** @enum {string} */
                            stockStatus: "IN_STOCK" | "LOW" | "OUT";
                            isFeatured: boolean;
                            category: {
                                id: string;
                                slug: string;
                                name: {
                                    ru: string;
                                    kk: string;
                                };
                            } | null;
                            badges: {
                                code: string;
                                label: {
                                    ru: string;
                                    kk: string;
                                };
                                /** @enum {string} */
                                tone: "GOLD" | "TEAL" | "STONE";
                                icon: string | null;
                            }[];
                            image: {
                                id: string;
                                url: string;
                                width: number;
                                height: number;
                                lqip: string | null;
                                alt: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                            } | null;
                            description: {
                                ru: string | null;
                                kk: string | null;
                            };
                            seoTitle: {
                                ru: string | null;
                                kk: string | null;
                            };
                            seoDescription: {
                                ru: string | null;
                                kk: string | null;
                            };
                            images: {
                                id: string;
                                url: string;
                                width: number;
                                height: number;
                                lqip: string | null;
                                alt: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                            }[];
                            bundleItems: {
                                qty: number;
                                product: {
                                    id: string;
                                    slug: string;
                                    /** @enum {string} */
                                    type: "SIMPLE" | "BUNDLE";
                                    name: {
                                        ru: string;
                                        kk: string;
                                    };
                                    short: {
                                        ru: string | null;
                                        kk: string | null;
                                    };
                                    price: number;
                                    compareAtPrice: number | null;
                                    weight: {
                                        value: number;
                                        /** @enum {string} */
                                        unit: "G" | "ML" | "PORTION" | "PCS";
                                    };
                                    /** @enum {string} */
                                    stockStatus: "IN_STOCK" | "LOW" | "OUT";
                                    isFeatured: boolean;
                                    category: {
                                        id: string;
                                        slug: string;
                                        name: {
                                            ru: string;
                                            kk: string;
                                        };
                                    } | null;
                                    badges: {
                                        code: string;
                                        label: {
                                            ru: string;
                                            kk: string;
                                        };
                                        /** @enum {string} */
                                        tone: "GOLD" | "TEAL" | "STONE";
                                        icon: string | null;
                                    }[];
                                    image: {
                                        id: string;
                                        url: string;
                                        width: number;
                                        height: number;
                                        lqip: string | null;
                                        alt: {
                                            ru: string | null;
                                            kk: string | null;
                                        };
                                    } | null;
                                };
                            }[];
                            componentsTotal: number | null;
                            isActive: boolean;
                            sortOrder: number;
                            stockQty: number | null;
                            costPrice: number | null;
                            updatedAt: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/products/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Товар целиком для редактора */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            slug: string;
                            /** @enum {string} */
                            type: "SIMPLE" | "BUNDLE";
                            name: {
                                ru: string;
                                kk: string;
                            };
                            short: {
                                ru: string | null;
                                kk: string | null;
                            };
                            price: number;
                            compareAtPrice: number | null;
                            weight: {
                                value: number;
                                /** @enum {string} */
                                unit: "G" | "ML" | "PORTION" | "PCS";
                            };
                            /** @enum {string} */
                            stockStatus: "IN_STOCK" | "LOW" | "OUT";
                            isFeatured: boolean;
                            category: {
                                id: string;
                                slug: string;
                                name: {
                                    ru: string;
                                    kk: string;
                                };
                            } | null;
                            badges: {
                                code: string;
                                label: {
                                    ru: string;
                                    kk: string;
                                };
                                /** @enum {string} */
                                tone: "GOLD" | "TEAL" | "STONE";
                                icon: string | null;
                            }[];
                            image: {
                                id: string;
                                url: string;
                                width: number;
                                height: number;
                                lqip: string | null;
                                alt: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                            } | null;
                            description: {
                                ru: string | null;
                                kk: string | null;
                            };
                            seoTitle: {
                                ru: string | null;
                                kk: string | null;
                            };
                            seoDescription: {
                                ru: string | null;
                                kk: string | null;
                            };
                            images: {
                                id: string;
                                url: string;
                                width: number;
                                height: number;
                                lqip: string | null;
                                alt: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                            }[];
                            bundleItems: {
                                qty: number;
                                product: {
                                    id: string;
                                    slug: string;
                                    /** @enum {string} */
                                    type: "SIMPLE" | "BUNDLE";
                                    name: {
                                        ru: string;
                                        kk: string;
                                    };
                                    short: {
                                        ru: string | null;
                                        kk: string | null;
                                    };
                                    price: number;
                                    compareAtPrice: number | null;
                                    weight: {
                                        value: number;
                                        /** @enum {string} */
                                        unit: "G" | "ML" | "PORTION" | "PCS";
                                    };
                                    /** @enum {string} */
                                    stockStatus: "IN_STOCK" | "LOW" | "OUT";
                                    isFeatured: boolean;
                                    category: {
                                        id: string;
                                        slug: string;
                                        name: {
                                            ru: string;
                                            kk: string;
                                        };
                                    } | null;
                                    badges: {
                                        code: string;
                                        label: {
                                            ru: string;
                                            kk: string;
                                        };
                                        /** @enum {string} */
                                        tone: "GOLD" | "TEAL" | "STONE";
                                        icon: string | null;
                                    }[];
                                    image: {
                                        id: string;
                                        url: string;
                                        width: number;
                                        height: number;
                                        lqip: string | null;
                                        alt: {
                                            ru: string | null;
                                            kk: string | null;
                                        };
                                    } | null;
                                };
                            }[];
                            componentsTotal: number | null;
                            isActive: boolean;
                            sortOrder: number;
                            stockQty: number | null;
                            costPrice: number | null;
                            updatedAt: string;
                        };
                    };
                };
            };
        };
        /** Полное обновление товара */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        slug?: string;
                        /**
                         * @default SIMPLE
                         * @enum {string}
                         */
                        type?: "SIMPLE" | "BUNDLE";
                        nameRu: string;
                        nameKk: string;
                        shortRu?: string | null;
                        shortKk?: string | null;
                        descriptionRu?: string | null;
                        descriptionKk?: string | null;
                        price: number;
                        compareAtPrice?: number | null;
                        costPrice?: number | null;
                        weightValue: number;
                        /**
                         * @default G
                         * @enum {string}
                         */
                        weightUnit?: "G" | "ML" | "PORTION" | "PCS";
                        categoryId?: string | null;
                        /**
                         * @default IN_STOCK
                         * @enum {string}
                         */
                        stockStatus?: "IN_STOCK" | "LOW" | "OUT";
                        stockQty?: number | null;
                        /** @default true */
                        isActive?: boolean;
                        /** @default false */
                        isFeatured?: boolean;
                        /** @default 0 */
                        sortOrder?: number;
                        seoTitleRu?: string | null;
                        seoTitleKk?: string | null;
                        seoDescRu?: string | null;
                        seoDescKk?: string | null;
                        /** @default [] */
                        images?: {
                            assetId: string;
                            altRu?: string | null;
                            altKk?: string | null;
                        }[];
                        /** @default [] */
                        badgeCodes?: string[];
                        /** @default [] */
                        bundleItems?: {
                            componentId: string;
                            qty: number;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            slug: string;
                            /** @enum {string} */
                            type: "SIMPLE" | "BUNDLE";
                            name: {
                                ru: string;
                                kk: string;
                            };
                            short: {
                                ru: string | null;
                                kk: string | null;
                            };
                            price: number;
                            compareAtPrice: number | null;
                            weight: {
                                value: number;
                                /** @enum {string} */
                                unit: "G" | "ML" | "PORTION" | "PCS";
                            };
                            /** @enum {string} */
                            stockStatus: "IN_STOCK" | "LOW" | "OUT";
                            isFeatured: boolean;
                            category: {
                                id: string;
                                slug: string;
                                name: {
                                    ru: string;
                                    kk: string;
                                };
                            } | null;
                            badges: {
                                code: string;
                                label: {
                                    ru: string;
                                    kk: string;
                                };
                                /** @enum {string} */
                                tone: "GOLD" | "TEAL" | "STONE";
                                icon: string | null;
                            }[];
                            image: {
                                id: string;
                                url: string;
                                width: number;
                                height: number;
                                lqip: string | null;
                                alt: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                            } | null;
                            description: {
                                ru: string | null;
                                kk: string | null;
                            };
                            seoTitle: {
                                ru: string | null;
                                kk: string | null;
                            };
                            seoDescription: {
                                ru: string | null;
                                kk: string | null;
                            };
                            images: {
                                id: string;
                                url: string;
                                width: number;
                                height: number;
                                lqip: string | null;
                                alt: {
                                    ru: string | null;
                                    kk: string | null;
                                };
                            }[];
                            bundleItems: {
                                qty: number;
                                product: {
                                    id: string;
                                    slug: string;
                                    /** @enum {string} */
                                    type: "SIMPLE" | "BUNDLE";
                                    name: {
                                        ru: string;
                                        kk: string;
                                    };
                                    short: {
                                        ru: string | null;
                                        kk: string | null;
                                    };
                                    price: number;
                                    compareAtPrice: number | null;
                                    weight: {
                                        value: number;
                                        /** @enum {string} */
                                        unit: "G" | "ML" | "PORTION" | "PCS";
                                    };
                                    /** @enum {string} */
                                    stockStatus: "IN_STOCK" | "LOW" | "OUT";
                                    isFeatured: boolean;
                                    category: {
                                        id: string;
                                        slug: string;
                                        name: {
                                            ru: string;
                                            kk: string;
                                        };
                                    } | null;
                                    badges: {
                                        code: string;
                                        label: {
                                            ru: string;
                                            kk: string;
                                        };
                                        /** @enum {string} */
                                        tone: "GOLD" | "TEAL" | "STONE";
                                        icon: string | null;
                                    }[];
                                    image: {
                                        id: string;
                                        url: string;
                                        width: number;
                                        height: number;
                                        lqip: string | null;
                                        alt: {
                                            ru: string | null;
                                            kk: string | null;
                                        };
                                    } | null;
                                };
                            }[];
                            componentsTotal: number | null;
                            isActive: boolean;
                            sortOrder: number;
                            stockQty: number | null;
                            costPrice: number | null;
                            updatedAt: string;
                        };
                    };
                };
            };
        };
        post?: never;
        /** Удаление товара */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            ok: boolean;
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/products/bulk": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Массовые правки: инлайн-цена, наличие, видимость, порядок */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        ids: string[];
                        patch: {
                            price?: number;
                            costPrice?: number | null;
                            isActive?: boolean;
                            isFeatured?: boolean;
                            /** @enum {string} */
                            stockStatus?: "IN_STOCK" | "LOW" | "OUT";
                            categoryId?: string | null;
                        };
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            updated: number;
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/admin/products/reorder": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Порядок товаров в каталоге (drag & drop) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        ids: string[];
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            ok: boolean;
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/admin/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Категории (включая скрытые) */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            slug: string;
                            nameRu: string;
                            nameKk: string;
                            descriptionRu: string | null;
                            descriptionKk: string | null;
                            imageId: string | null;
                            sortOrder: number;
                            isVisible: boolean;
                            productCount: number;
                        }[];
                    };
                };
            };
        };
        put?: never;
        /** Создание категории */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        slug?: string;
                        nameRu: string;
                        nameKk: string;
                        descriptionRu?: string | null;
                        descriptionKk?: string | null;
                        imageId?: string | null;
                        /** @default 0 */
                        sortOrder?: number;
                        /** @default true */
                        isVisible?: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            slug: string;
                            nameRu: string;
                            nameKk: string;
                            descriptionRu: string | null;
                            descriptionKk: string | null;
                            imageId: string | null;
                            sortOrder: number;
                            isVisible: boolean;
                            productCount: number;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/categories/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Обновление категории */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        slug?: string;
                        nameRu: string;
                        nameKk: string;
                        descriptionRu?: string | null;
                        descriptionKk?: string | null;
                        imageId?: string | null;
                        /** @default 0 */
                        sortOrder?: number;
                        /** @default true */
                        isVisible?: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            slug: string;
                            nameRu: string;
                            nameKk: string;
                            descriptionRu: string | null;
                            descriptionKk: string | null;
                            imageId: string | null;
                            sortOrder: number;
                            isVisible: boolean;
                            productCount: number;
                        };
                    };
                };
            };
        };
        post?: never;
        /** Удаление категории */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            ok: boolean;
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/collections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Подборки товаров */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            slug: string;
                            titleRu: string;
                            titleKk: string;
                            subtitleRu: string | null;
                            subtitleKk: string | null;
                            isVisible: boolean;
                            sortOrder: number;
                            productIds: string[];
                        }[];
                    };
                };
            };
        };
        put?: never;
        /** Создание подборки */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        slug?: string;
                        titleRu: string;
                        titleKk: string;
                        subtitleRu?: string | null;
                        subtitleKk?: string | null;
                        /** @default true */
                        isVisible?: boolean;
                        /** @default 0 */
                        sortOrder?: number;
                        /** @default [] */
                        productIds?: string[];
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            slug: string;
                            titleRu: string;
                            titleKk: string;
                            subtitleRu: string | null;
                            subtitleKk: string | null;
                            isVisible: boolean;
                            sortOrder: number;
                            productIds: string[];
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/collections/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Обновление подборки и её состава */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        slug?: string;
                        titleRu: string;
                        titleKk: string;
                        subtitleRu?: string | null;
                        subtitleKk?: string | null;
                        /** @default true */
                        isVisible?: boolean;
                        /** @default 0 */
                        sortOrder?: number;
                        /** @default [] */
                        productIds?: string[];
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            slug: string;
                            titleRu: string;
                            titleKk: string;
                            subtitleRu: string | null;
                            subtitleKk: string | null;
                            isVisible: boolean;
                            sortOrder: number;
                            productIds: string[];
                        };
                    };
                };
            };
        };
        post?: never;
        /** Удаление подборки */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            ok: boolean;
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/home-sections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Секции главной страницы, включая скрытые */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            /** @enum {string} */
                            kind: "HERO" | "COLLECTION" | "BUNDLES" | "CATEGORIES" | "EDITORIAL" | "BANNER" | "STEPS" | "FAQ" | "CONTACTS";
                            payload: {
                                [key: string]: unknown;
                            };
                            sortOrder: number;
                            isVisible: boolean;
                        }[];
                    };
                };
            };
        };
        put?: never;
        /** Добавление секции на главную */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @enum {string} */
                        kind: "HERO" | "COLLECTION" | "BUNDLES" | "CATEGORIES" | "EDITORIAL" | "BANNER" | "STEPS" | "FAQ" | "CONTACTS";
                        /** @default {} */
                        payload?: {
                            [key: string]: unknown;
                        };
                        /** @default 0 */
                        sortOrder?: number;
                        /** @default true */
                        isVisible?: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            /** @enum {string} */
                            kind: "HERO" | "COLLECTION" | "BUNDLES" | "CATEGORIES" | "EDITORIAL" | "BANNER" | "STEPS" | "FAQ" | "CONTACTS";
                            payload: {
                                [key: string]: unknown;
                            };
                            sortOrder: number;
                            isVisible: boolean;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/home-sections/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Редактирование секции главной */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        payload: {
                            [key: string]: unknown;
                        };
                        isVisible: boolean;
                        sortOrder: number;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            /** @enum {string} */
                            kind: "HERO" | "COLLECTION" | "BUNDLES" | "CATEGORIES" | "EDITORIAL" | "BANNER" | "STEPS" | "FAQ" | "CONTACTS";
                            payload: {
                                [key: string]: unknown;
                            };
                            sortOrder: number;
                            isVisible: boolean;
                        };
                    };
                };
            };
        };
        post?: never;
        /** Удаление секции главной */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            ok: boolean;
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/home-sections/reorder": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Порядок секций главной (drag & drop) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        ids: string[];
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            ok: boolean;
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/admin/settings/{group}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Сохранение группы настроек (контакты, доставка, бренд) */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    group: "contacts" | "delivery" | "payment" | "brand";
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            contacts?: {
                                phone: string;
                                whatsapp: string;
                                telegram: string;
                                instagram: string;
                                email: string;
                                address: {
                                    ru: string;
                                    kk: string;
                                };
                                workingHours: {
                                    ru: string;
                                    kk: string;
                                };
                            };
                            delivery?: {
                                minOrder: number;
                                baseFee: number;
                                freeFrom: number | null;
                                pickupAddress: {
                                    ru: string;
                                    kk: string;
                                };
                                note: {
                                    ru: string;
                                    kk: string;
                                };
                            };
                            payment?: {
                                kaspiEnabled: boolean;
                                kaspiLink: string;
                                kaspiAmountManual: boolean;
                                note: {
                                    ru: string;
                                    kk: string;
                                };
                            };
                            brand?: {
                                name: string;
                                tagline: {
                                    ru: string;
                                    kk: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/badges": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Справочник бейджей */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            code: string;
                            labelRu: string;
                            labelKk: string;
                            /** @enum {string} */
                            tone: "GOLD" | "TEAL" | "STONE";
                        }[];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Заявки с витрины */
        get: {
            parameters: {
                query?: {
                    status?: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED";
                    search?: string;
                    includeTest?: boolean | string;
                    paid?: "yes" | "no";
                    archived?: "no" | "only" | "all";
                    limit?: number;
                    offset?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            items: {
                                id: string;
                                number: string;
                                customerName: string;
                                phone: string;
                                /** @enum {string} */
                                channel: "WHATSAPP" | "TELEGRAM";
                                /** @enum {string} */
                                customerType: "PERSON" | "BUSINESS";
                                /** @enum {string} */
                                deliveryType: "DELIVERY" | "PICKUP";
                                address: string | null;
                                comment: string | null;
                                subtotal: number;
                                deliveryFee: number;
                                total: number;
                                /** @enum {string} */
                                status: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED";
                                isTest: boolean;
                                isPaid: boolean;
                                paidAt: string | null;
                                archivedAt: string | null;
                                createdAt: string;
                                itemsCount: number;
                                items: {
                                    id: string;
                                    productId: string | null;
                                    nameRu: string;
                                    nameKk: string;
                                    price: number;
                                    qty: number;
                                    weightLabel: string;
                                }[];
                                chatUrl: string;
                                events: {
                                    id: string;
                                    /** @enum {string|null} */
                                    fromStatus: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED" | null;
                                    /** @enum {string} */
                                    toStatus: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED";
                                    note: string | null;
                                    userName: string | null;
                                    createdAt: string;
                                }[];
                            }[];
                            total: number;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/orders/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Смена статуса заказа (канбан) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @enum {string} */
                        status: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED";
                        note?: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            number: string;
                            customerName: string;
                            phone: string;
                            /** @enum {string} */
                            channel: "WHATSAPP" | "TELEGRAM";
                            /** @enum {string} */
                            customerType: "PERSON" | "BUSINESS";
                            /** @enum {string} */
                            deliveryType: "DELIVERY" | "PICKUP";
                            address: string | null;
                            comment: string | null;
                            subtotal: number;
                            deliveryFee: number;
                            total: number;
                            /** @enum {string} */
                            status: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED";
                            isTest: boolean;
                            isPaid: boolean;
                            paidAt: string | null;
                            archivedAt: string | null;
                            createdAt: string;
                            itemsCount: number;
                            items: {
                                id: string;
                                productId: string | null;
                                nameRu: string;
                                nameKk: string;
                                price: number;
                                qty: number;
                                weightLabel: string;
                            }[];
                            chatUrl: string;
                            events: {
                                id: string;
                                /** @enum {string|null} */
                                fromStatus: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED" | null;
                                /** @enum {string} */
                                toStatus: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED";
                                note: string | null;
                                userName: string | null;
                                createdAt: string;
                            }[];
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/admin/orders/{id}/paid": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Отметка об оплате
         * @description Сейчас ставится вручную: Kaspi Pay не сообщает сайту об оплате по ссылке. Эти же поля будет заполнять callback эквайринга, когда он появится.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        isPaid: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            number: string;
                            customerName: string;
                            phone: string;
                            /** @enum {string} */
                            channel: "WHATSAPP" | "TELEGRAM";
                            /** @enum {string} */
                            customerType: "PERSON" | "BUSINESS";
                            /** @enum {string} */
                            deliveryType: "DELIVERY" | "PICKUP";
                            address: string | null;
                            comment: string | null;
                            subtotal: number;
                            deliveryFee: number;
                            total: number;
                            /** @enum {string} */
                            status: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED";
                            isTest: boolean;
                            isPaid: boolean;
                            paidAt: string | null;
                            archivedAt: string | null;
                            createdAt: string;
                            itemsCount: number;
                            items: {
                                id: string;
                                productId: string | null;
                                nameRu: string;
                                nameKk: string;
                                price: number;
                                qty: number;
                                weightLabel: string;
                            }[];
                            chatUrl: string;
                            events: {
                                id: string;
                                /** @enum {string|null} */
                                fromStatus: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED" | null;
                                /** @enum {string} */
                                toStatus: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED";
                                note: string | null;
                                userName: string | null;
                                createdAt: string;
                            }[];
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/admin/orders/{id}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Архивация заказа (мягкая альтернатива удалению)
         * @description Архивный заказ исчезает из канбана и из финансового отчёта, но остаётся в базе и восстанавливается тем же запросом с archived: false.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        archived: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            number: string;
                            customerName: string;
                            phone: string;
                            /** @enum {string} */
                            channel: "WHATSAPP" | "TELEGRAM";
                            /** @enum {string} */
                            customerType: "PERSON" | "BUSINESS";
                            /** @enum {string} */
                            deliveryType: "DELIVERY" | "PICKUP";
                            address: string | null;
                            comment: string | null;
                            subtotal: number;
                            deliveryFee: number;
                            total: number;
                            /** @enum {string} */
                            status: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED";
                            isTest: boolean;
                            isPaid: boolean;
                            paidAt: string | null;
                            archivedAt: string | null;
                            createdAt: string;
                            itemsCount: number;
                            items: {
                                id: string;
                                productId: string | null;
                                nameRu: string;
                                nameKk: string;
                                price: number;
                                qty: number;
                                weightLabel: string;
                            }[];
                            chatUrl: string;
                            events: {
                                id: string;
                                /** @enum {string|null} */
                                fromStatus: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED" | null;
                                /** @enum {string} */
                                toStatus: "NEW" | "CONFIRMED" | "COOKING" | "DELIVERING" | "DONE" | "CANCELLED";
                                note: string | null;
                                userName: string | null;
                                createdAt: string;
                            }[];
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/admin/orders/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Безвозвратное удаление заказа (только владелец, только из архива)
         * @description Сначала заказ нужно отправить в архив. Удаление снимает его вместе с позициями и историей статусов — отменить это нельзя.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {number} */
                            deleted: 1;
                            number: string;
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/orders/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Очистка тестовых заказов, созданных прогонами Playwright */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            deleted: number;
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Данные для виджетов дашборда */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            orders: {
                                today: number;
                                week: number;
                                new: number;
                                inProgress: number;
                            };
                            revenue: {
                                today: number;
                                week: number;
                                month: number;
                            };
                            catalog: {
                                products: number;
                                bundles: number;
                                hidden: number;
                                outOfStock: number;
                                withoutPhoto: number;
                            };
                            topProducts: {
                                nameRu: string;
                                qty: number;
                                revenue: number;
                            }[];
                            recentOrders: {
                                id: string;
                                number: string;
                                customerName: string;
                                total: number;
                                status: string;
                                createdAt: string;
                            }[];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Журнал действий пользователей */
        get: {
            parameters: {
                query?: {
                    entity?: string;
                    limit?: number;
                    offset?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            items: {
                                id: string;
                                entity: string;
                                entityId: string | null;
                                action: string;
                                diff?: unknown;
                                userName: string | null;
                                createdAt: string;
                            }[];
                            total: number;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Пользователи админки */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            email: string;
                            name: string;
                            /** @enum {string} */
                            role: "OWNER" | "MANAGER" | "VIEWER";
                            isActive: boolean;
                            lastLoginAt: string | null;
                            createdAt: string;
                        }[];
                    };
                };
            };
        };
        put?: never;
        /** Добавление пользователя */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** Format: email */
                        email: string;
                        name: string;
                        password: string;
                        /**
                         * @default MANAGER
                         * @enum {string}
                         */
                        role?: "OWNER" | "MANAGER" | "VIEWER";
                    };
                };
            };
            responses: {
                /** @description Default Response */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            email: string;
                            name: string;
                            /** @enum {string} */
                            role: "OWNER" | "MANAGER" | "VIEWER";
                            isActive: boolean;
                            lastLoginAt: string | null;
                            createdAt: string;
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Изменение роли, доступа или пароля */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        name?: string;
                        /** @enum {string} */
                        role?: "OWNER" | "MANAGER" | "VIEWER";
                        isActive?: boolean;
                        password?: string;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            email: string;
                            name: string;
                            /** @enum {string} */
                            role: "OWNER" | "MANAGER" | "VIEWER";
                            isActive: boolean;
                            lastLoginAt: string | null;
                            createdAt: string;
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/admin/finance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Отчёт по продажам, выручке и прибыли
         * @description Отменённые, архивные и тестовые заказы в отчёт не входят. Прибыль = деньги за товары минус себестоимость; доставка в прибыль не идёт.
         */
        get: {
            parameters: {
                query?: {
                    from?: string;
                    to?: string;
                    paidOnly?: boolean | string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            from: string;
                            to: string;
                            totals: {
                                key: string;
                                orders: number;
                                goods: number;
                                delivery: number;
                                revenue: number;
                                cost: number;
                                profit: number | null;
                            };
                            payment: {
                                paidCount: number;
                                paidAmount: number;
                                unpaidCount: number;
                                unpaidAmount: number;
                            };
                            coverage: {
                                positions: number;
                                positionsWithCost: number;
                                goodsWithCost: number;
                                goodsWithoutCost: number;
                                missing: {
                                    nameRu: string;
                                    qty: number;
                                    goods: number;
                                }[];
                            };
                            byDay: {
                                key: string;
                                orders: number;
                                goods: number;
                                delivery: number;
                                revenue: number;
                                cost: number;
                                profit: number | null;
                            }[];
                            byProduct: {
                                key: string;
                                orders: number;
                                goods: number;
                                delivery: number;
                                revenue: number;
                                cost: number;
                                profit: number | null;
                                qty: number;
                                hasCost: boolean;
                            }[];
                            byStatus: {
                                status: string;
                                orders: number;
                                revenue: number;
                            }[];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Сообщения с витрины */
        get: {
            parameters: {
                query?: {
                    kind?: "WISH" | "REVIEW" | "QUESTION";
                    read?: "yes" | "no";
                    search?: string;
                    includeTest?: boolean | string;
                    archived?: "no" | "only" | "all";
                    limit?: number;
                    offset?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            items: {
                                id: string;
                                /** @enum {string} */
                                kind: "WISH" | "REVIEW" | "QUESTION";
                                name: string;
                                contact: string | null;
                                message: string;
                                locale: string;
                                isRead: boolean;
                                readAt: string | null;
                                isTest: boolean;
                                archivedAt: string | null;
                                createdAt: string;
                                replyUrl: string | null;
                            }[];
                            total: number;
                            unread: number;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/feedback/unread": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Сколько непрочитанных сообщений */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            unread: number;
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/feedback/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Отметка «прочитано» */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        isRead: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            /** @enum {string} */
                            kind: "WISH" | "REVIEW" | "QUESTION";
                            name: string;
                            contact: string | null;
                            message: string;
                            locale: string;
                            isRead: boolean;
                            readAt: string | null;
                            isTest: boolean;
                            archivedAt: string | null;
                            createdAt: string;
                            replyUrl: string | null;
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/admin/feedback/{id}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Архивация сообщения (мягкая альтернатива удалению) */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        archived: boolean;
                    };
                };
            };
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            id: string;
                            /** @enum {string} */
                            kind: "WISH" | "REVIEW" | "QUESTION";
                            name: string;
                            contact: string | null;
                            message: string;
                            locale: string;
                            isRead: boolean;
                            readAt: string | null;
                            isTest: boolean;
                            archivedAt: string | null;
                            createdAt: string;
                            replyUrl: string | null;
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/v1/admin/feedback/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Очистка сообщений, созданных прогонами Playwright */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Default Response */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            deleted: number;
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: never;
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
