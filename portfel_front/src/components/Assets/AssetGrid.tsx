import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Asset } from '../../types';

const columns: GridColDef[] = [
    { field: 'ticker', headerName: 'Тикер', width: 100 },
    { field: 'company', headerName: 'Компания', width: 200 },
    { field: 'country', headerName: 'Страна', width: 120 },
    { field: 'dividend_yield', headerName: 'Див. доходность', type: 'number', width: 150 },
    { field: 'pe_ratio', headerName: 'P/E', type: 'number', width: 120 },
    { field: 'pb_ratio', headerName: 'P/B', type: 'number', width: 120 },
    { field: 'beta', headerName: 'Бета', type: 'number', width: 120 },
];

const AssetGrid: React.FC<{ assets: Asset[] }> = ({ assets }) => {
    return (
        <div style={{ height: 400, width: '100%' }}>
            <DataGrid
                rows={assets}
                columns={columns}
                getRowId={(row) => row.Asset_ID}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 5 },
                    },
                }}
                pageSizeOptions={[5, 10]}
            />
        </div>
    );
};

export default AssetGrid;