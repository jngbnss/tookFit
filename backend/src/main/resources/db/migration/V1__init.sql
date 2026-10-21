-- TUK FIT 초기 스키마. docs/DATABASE.md와 같은 구조를 유지한다.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 회원 ---------------------------------------------------------------

CREATE TABLE users (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email            VARCHAR(255) UNIQUE,
    password_hash    VARCHAR(100),
    name             VARCHAR(50)  NOT NULL,
    phone            VARCHAR(20),
    role             VARCHAR(20)  NOT NULL,
    status           VARCHAR(20)  NOT NULL,
    marketing_agreed BOOLEAN      NOT NULL DEFAULT FALSE,
    last_login_at    TIMESTAMPTZ,
    withdrawn_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL,
    updated_at       TIMESTAMPTZ  NOT NULL
);

CREATE TABLE social_accounts (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          BIGINT       NOT NULL REFERENCES users (id),
    provider         VARCHAR(20)  NOT NULL,
    provider_user_id VARCHAR(100) NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL,
    updated_at       TIMESTAMPTZ  NOT NULL,
    UNIQUE (provider, provider_user_id)
);
CREATE INDEX idx_social_accounts_user ON social_accounts (user_id);

CREATE TABLE refresh_tokens (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users (id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);

CREATE TABLE password_reset_tokens (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users (id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE addresses (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users (id),
    label       VARCHAR(30),
    recipient   VARCHAR(50)  NOT NULL,
    phone       VARCHAR(20)  NOT NULL,
    postal_code VARCHAR(10)  NOT NULL,
    address1    VARCHAR(255) NOT NULL,
    address2    VARCHAR(255),
    is_default  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_addresses_user ON addresses (user_id);

-- 상품 ---------------------------------------------------------------

CREATE TABLE categories (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug       VARCHAR(50) NOT NULL UNIQUE,
    name       VARCHAR(50) NOT NULL,
    sort_order INT         NOT NULL DEFAULT 0,
    visible    BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE products (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug           VARCHAR(100) NOT NULL UNIQUE,
    category_id    BIGINT       NOT NULL REFERENCES categories (id),
    name           VARCHAR(100) NOT NULL,
    description    TEXT,
    price          BIGINT       NOT NULL CHECK (price >= 0),
    original_price BIGINT,
    badge          VARCHAR(20),
    material       VARCHAR(255),
    fit            VARCHAR(255),
    care           TEXT,
    status         VARCHAR(20)  NOT NULL,
    featured_rank  INT,
    published_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL,
    updated_at     TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_products_status_category ON products (status, category_id, featured_rank);
CREATE INDEX idx_products_status_published ON products (status, published_at DESC);
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

CREATE TABLE product_colors (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    name       VARCHAR(30) NOT NULL,
    hex        VARCHAR(7)  NOT NULL,
    sort_order INT         NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_product_colors_product ON product_colors (product_id);

CREATE TABLE product_variants (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    color_id   BIGINT      NOT NULL REFERENCES product_colors (id),
    size       VARCHAR(10) NOT NULL,
    sku        VARCHAR(50) NOT NULL UNIQUE,
    stock      INT         NOT NULL CHECK (stock >= 0),
    active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (product_id, color_id, size)
);
CREATE INDEX idx_product_variants_product ON product_variants (product_id);

CREATE TABLE product_images (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id  BIGINT       NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    color_id    BIGINT REFERENCES product_colors (id) ON DELETE SET NULL,
    storage_key VARCHAR(255) NOT NULL,
    alt         VARCHAR(255),
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_product_images_product ON product_images (product_id, sort_order);

-- 장바구니, 위시리스트 --------------------------------------------------

CREATE TABLE cart_items (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users (id),
    variant_id BIGINT      NOT NULL REFERENCES product_variants (id),
    quantity   INT         NOT NULL CHECK (quantity BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (user_id, variant_id)
);

CREATE TABLE wishlists (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users (id),
    product_id BIGINT      NOT NULL REFERENCES products (id),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (user_id, product_id)
);

-- 쿠폰 ---------------------------------------------------------------

CREATE TABLE coupons (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code             VARCHAR(30)  NOT NULL UNIQUE,
    name             VARCHAR(100) NOT NULL,
    discount_type    VARCHAR(10)  NOT NULL,
    discount_value   BIGINT       NOT NULL,
    max_discount     BIGINT,
    min_order_amount BIGINT       NOT NULL DEFAULT 0,
    starts_at        TIMESTAMPTZ,
    ends_at          TIMESTAMPTZ,
    usage_limit      INT,
    per_user_limit   INT          NOT NULL DEFAULT 1,
    used_count       INT          NOT NULL DEFAULT 0,
    active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL,
    updated_at       TIMESTAMPTZ  NOT NULL
);

-- 주문, 결제, 배송 -------------------------------------------------------

CREATE TABLE orders (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_number    VARCHAR(30)  NOT NULL UNIQUE,
    user_id         BIGINT       NOT NULL REFERENCES users (id),
    status          VARCHAR(30)  NOT NULL,
    order_name      VARCHAR(150) NOT NULL,
    subtotal        BIGINT       NOT NULL,
    discount        BIGINT       NOT NULL,
    shipping_fee    BIGINT       NOT NULL,
    total           BIGINT       NOT NULL,
    coupon_id       BIGINT REFERENCES coupons (id),
    coupon_code     VARCHAR(30),
    recipient       VARCHAR(50)  NOT NULL,
    recipient_phone VARCHAR(20)  NOT NULL,
    postal_code     VARCHAR(10)  NOT NULL,
    address1        VARCHAR(255) NOT NULL,
    address2        VARCHAR(255),
    delivery_memo   VARCHAR(255),
    orderer_name    VARCHAR(50)  NOT NULL,
    orderer_email   VARCHAR(255),
    orderer_phone   VARCHAR(20),
    from_cart       BOOLEAN      NOT NULL DEFAULT FALSE,
    paid_at         TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_orders_user ON orders (user_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders (status, created_at DESC);

CREATE TABLE order_items (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id     BIGINT       NOT NULL REFERENCES orders (id),
    variant_id   BIGINT       NOT NULL REFERENCES product_variants (id),
    product_id   BIGINT       NOT NULL,
    product_slug VARCHAR(100) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    color_name   VARCHAR(30)  NOT NULL,
    size         VARCHAR(10)  NOT NULL,
    image_key    VARCHAR(255),
    unit_price   BIGINT       NOT NULL,
    quantity     INT          NOT NULL CHECK (quantity > 0),
    line_total   BIGINT       NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL,
    updated_at   TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_order_items_order ON order_items (order_id);

CREATE TABLE payments (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id         BIGINT      NOT NULL REFERENCES orders (id),
    provider         VARCHAR(20) NOT NULL,
    pg_payment_key   VARCHAR(200) UNIQUE,
    method           VARCHAR(30),
    status           VARCHAR(20) NOT NULL,
    amount           BIGINT      NOT NULL,
    cancelled_amount BIGINT      NOT NULL DEFAULT 0,
    approved_at      TIMESTAMPTZ,
    failure_reason   VARCHAR(255),
    raw_response     JSONB,
    created_at       TIMESTAMPTZ NOT NULL,
    updated_at       TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_payments_order ON payments (order_id);

-- 같은 웹훅 이벤트를 두 번 처리하지 않기 위한 기록
CREATE TABLE payment_webhook_events (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    provider   VARCHAR(20)  NOT NULL,
    event_key  VARCHAR(255) NOT NULL,
    payload    JSONB,
    created_at TIMESTAMPTZ  NOT NULL,
    updated_at TIMESTAMPTZ  NOT NULL,
    UNIQUE (provider, event_key)
);

CREATE TABLE shipments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id        BIGINT      NOT NULL UNIQUE REFERENCES orders (id),
    carrier         VARCHAR(30) NOT NULL,
    tracking_number VARCHAR(50) NOT NULL,
    shipped_at      TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL
);

CREATE TABLE order_status_histories (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id    BIGINT      NOT NULL REFERENCES orders (id),
    from_status VARCHAR(30),
    to_status   VARCHAR(30) NOT NULL,
    changed_by  BIGINT REFERENCES users (id),
    reason      VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_order_status_histories_order ON order_status_histories (order_id, created_at);

CREATE TABLE order_claims (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_item_id       BIGINT      NOT NULL REFERENCES order_items (id),
    type                VARCHAR(20) NOT NULL,
    reason_type         VARCHAR(30) NOT NULL,
    reason_detail       TEXT,
    quantity            INT         NOT NULL CHECK (quantity > 0),
    status              VARCHAR(20) NOT NULL,
    return_shipping_fee BIGINT      NOT NULL DEFAULT 0,
    refund_amount       BIGINT,
    exchange_variant_id BIGINT REFERENCES product_variants (id),
    created_at          TIMESTAMPTZ NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_order_claims_item ON order_claims (order_item_id);
CREATE INDEX idx_order_claims_status ON order_claims (status, created_at DESC);

-- 리뷰 ---------------------------------------------------------------

CREATE TABLE reviews (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id    BIGINT      NOT NULL REFERENCES products (id),
    user_id       BIGINT      NOT NULL REFERENCES users (id),
    order_item_id BIGINT UNIQUE REFERENCES order_items (id),
    option_label  VARCHAR(60) NOT NULL,
    rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title         VARCHAR(100),
    body          TEXT        NOT NULL,
    height_cm     SMALLINT,
    fit_feedback  VARCHAR(20),
    status        VARCHAR(20) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_reviews_product ON reviews (product_id, status, created_at DESC);

-- 화면 운영 -------------------------------------------------------------

CREATE TABLE banners (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    position         VARCHAR(30)  NOT NULL,
    title            VARCHAR(100),
    subtitle         VARCHAR(100),
    image_key        VARCHAR(255),
    mobile_image_key VARCHAR(255),
    link_url         VARCHAR(255),
    sort_order       INT          NOT NULL DEFAULT 0,
    starts_at        TIMESTAMPTZ,
    ends_at          TIMESTAMPTZ,
    active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL,
    updated_at       TIMESTAMPTZ  NOT NULL
);
CREATE INDEX idx_banners_position ON banners (position, active, sort_order);

CREATE TABLE notices (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title      VARCHAR(200) NOT NULL,
    body       TEXT         NOT NULL,
    pinned     BOOLEAN      NOT NULL DEFAULT FALSE,
    published  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL,
    updated_at TIMESTAMPTZ  NOT NULL
);

-- 스토어 설정은 한 행만 둔다 (id = 1).
CREATE TABLE store_settings (
    id                       BIGINT PRIMARY KEY CHECK (id = 1),
    store_name               VARCHAR(100) NOT NULL,
    shipping_fee             BIGINT       NOT NULL,
    free_shipping_threshold  BIGINT       NOT NULL,
    max_quantity_per_item    INT          NOT NULL,
    return_shipping_fee      BIGINT       NOT NULL,
    cs_phone                 VARCHAR(30),
    cs_email                 VARCHAR(255),
    cs_hours                 VARCHAR(100),
    company_name             VARCHAR(100),
    ceo_name                 VARCHAR(50),
    registration_number      VARCHAR(30),
    mail_order_number        VARCHAR(50),
    business_address         VARCHAR(255),
    privacy_officer          VARCHAR(50),
    created_at               TIMESTAMPTZ  NOT NULL,
    updated_at               TIMESTAMPTZ  NOT NULL
);

INSERT INTO store_settings (id, store_name, shipping_fee, free_shipping_threshold, max_quantity_per_item,
                            return_shipping_fee, created_at, updated_at)
VALUES (1, 'TUK FIT', 3000, 50000, 5, 6000, now(), now());
