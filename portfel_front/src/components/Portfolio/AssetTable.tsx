// AssetTable.tsx
import React from 'react';
// Убедимся, что импортируем только необходимое
import {DataGrid, GridColDef} from '@mui/x-data-grid';
import {useTheme} from '@mui/material/styles';
import {useGetPortfolioAssetsQuery, TransformedPortfolioAsset} from '../../api/portfolioApi';

interface AssetTableProps {
    portfolioId: number;
}

interface TableRowData {
    id: number;
    quantity: number;
    average_price: number;
    total_value: number;
}

const AssetTable: React.FC<AssetTableProps> = ({portfolioId}) => {
    const theme = useTheme();
    const {data: portfolioAssets, isLoading, error} = useGetPortfolioAssetsQuery(portfolioId);

    const transformApiDataToRowData = (apiAsset: TransformedPortfolioAsset): TableRowData => ({
        id: apiAsset.ID,
        quantity: apiAsset.quantity,
        average_price: apiAsset.average_price,
        total_value: apiAsset.total_value,
    });

    const columns: GridColDef<TableRowData>[] = [
        {
            field: 'quantity',
            headerName: 'Кол-во',
            type: 'number', // Важно для типа value
            width: 150,
            align: 'right',
            headerAlign: 'right',

        },
        {
            field: 'average_price',
            headerName: 'Ср. цена',
            type: 'number',
            width: 180,
            align: 'right',
            headerAlign: 'right',

        },
        {
            field: 'total_value',
            headerName: 'Общая стоимость',
            type: 'number',
            width: 200,
            align: 'right',
            headerAlign: 'right',

        },
    ];

    if (isLoading) return <div>Загрузка позиций портфеля...</div>;

    if (error) {
        console.error("Ошибка загрузки позиций портфеля:", error);
        let errorMessage = "Ошибка загрузки данных.";
        if (typeof error === 'object' && error !== null && 'status' in error) {
            errorMessage += ` Статус: ${(error as { status: number }).status}.`;
        }
        if (typeof error === 'object' && error !== null && 'data' in error) {
            const errorData = error.data as any;
            errorMessage += ` ${errorData?.detail || errorData?.message || JSON.stringify(errorData)}`;
        } else if (typeof error === 'object' && error !== null && 'error' in error) {
            errorMessage += ` ${(error as { error: string }).error}`;
        }
        return <div>{errorMessage} См. консоль для полной информации.</div>;
    }

    if (!portfolioAssets || !Array.isArray(portfolioAssets)) {
        console.warn("Данные о позициях портфеля не получены или имеют неверный формат:", portfolioAssets);
        return <div>Нет данных для отображения.</div>;
    }

    const rows: TableRowData[] = portfolioAssets.map(transformApiDataToRowData);

    return (
        <div style={{height: 400, width: '100%', minWidth: 550}}>
            <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row: TableRowData) => row.id}
                sx={{
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: theme.palette.secondary.main,
                        color: theme.palette.primary.main,
                    },
                    '& .MuiDataGrid-cell': {
                        borderBottom: `1px solid ${theme.palette.secondary.main}`,
                    },
                    '& .MuiDataGrid-row': {
                        '&:hover': {
                            backgroundColor: '#333333',
                        },
                    },
                }}
                initialState={{
                    pagination: {
                        paginationModel: {page: 0, pageSize: 5},
                    },
                }}
                pageSizeOptions={[5, 10]}
                autoHeight
                localeText={{noRowsLabel: 'Нет позиций в портфеле'}}
            />
        </div>
    );
};

export default AssetTable;