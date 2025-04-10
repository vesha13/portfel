export interface Portfolio {
    Port_ID: number;
    name: string;
    total_value: number;
    profit_loss: number;
    yield_percent: number;
    annual_yield: number;
    created_at: string;
    user_id: number;
}

export interface Asset {
    Asset_ID: number;
    ticker: string;
    company: string;
    quantity: number;
    average_price: number;
    current_price: number;
    profit_loss: number;
    dividend_yield: number;
    beta: number;
    pe_ratio: number;
    pb_ratio: number;
    // Дополнительные поля
}

export interface Deal {
    Deal_ID: number;
    type: boolean;
    quantity: number;
    price: number;
    date: string;
    asset: Asset;
}