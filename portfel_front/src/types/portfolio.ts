export interface Portfolio {
    Port_ID: number;
    name: string;
    total_value: number;
    profit_loss: number;
    yield_percent: number;
    annual_yield: number;
    created_at: string;
    user: number;
    portfolio_assets: PortfolioAsset[];
}

export interface PortfolioAsset {
    ID: number;
    portfolio: number;
    asset: Asset;
    quantity: number;
    average_price: number;
    total_value: number;
}
export interface Asset {
    Asset_ID: number;
    ISIN: string;
    ticker: string;
    company: string;
    country: string;
    region: string;
    exchange: string;
    market: string;
    trading_type: string;
    management_fee: string;
    currency: string;
    description: string;
    dividend_yield: string | null;
    pe_ratio: string | null;
    pb_ratio: string | null;
    beta: string | null;
    current_price: string | null;
    asset_type_name: string; // Убедитесь, что это поле здесь есть
    asset_type_id?: number;
    // Если приходит весь объект asset_type:
    asset_type: number;
}

export interface Deal {
    Deal_ID: number;
    portfolio: number; // ID портфеля
    asset: number;     // ID актива (как приходит из DealsSerializer)
    asset_ticker?: string; // Тикер актива (read_only из DealsSerializer)
    address: string;
    status: string;
    type: boolean; // true=BUY, false=SELL
    quantity: string; // Используем строку, т.к. DecimalField может приходить как строка
    price: string;
    total: string;
    commission: string;
    tax: string;
    date: string; // Дата в виде строки ISO
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}