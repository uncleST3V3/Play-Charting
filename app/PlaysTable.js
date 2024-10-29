import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { useTable, useSortBy } from 'react-table';

const PlaysTable = () => {
    const [plays, setPlays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({});

    useEffect(() => {
        const fetchCSV = async () => {
            try {
                const response = await fetch('/Nebraska 24.csv');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const reader = response.body.getReader();
                const result = await reader.read();
                const decoder = new TextDecoder('utf-8');
                const csv = decoder.decode(result.value);
                const { data } = Papa.parse(csv, { header: true });
                setPlays(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCSV();
    }, []);

    const columns = useMemo(() => 
        plays.length > 0 ? Object.keys(plays[0]).map(key => ({
            Header: key,
            accessor: key,
            // Add a filter option for each column
            Filter: ({ column }) => (
                <select
                    value={filters[key] || ''}
                    onChange={(e) => {
                        const value = e.target.value;
                        setFilters(prev => ({ ...prev, [key]: value }));
                    }}
                    style={{ margin: '0.5em', padding: '0.5em', borderRadius: '4px' }}
                >
                    <option value="">All</option>
                    {[...new Set(plays.map(play => play[key]))].map((value, index) => (
                        <option key={index} value={value}>
                            {value}
                        </option>
                    ))}
                </select>
            ),
        })) : [],
        [plays, filters]
    );

    // Filter plays based on selected dropdown filters
    const filteredPlays = useMemo(() => {
        return plays.filter(play => {
            return Object.keys(filters).every(key => {
                if (!filters[key]) return true; // No filter for this column
                return play[key] === filters[key]; // Filter by selected value
            });
        });
    }, [plays, filters]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data: filteredPlays }, useSortBy);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <table {...getTableProps()} style={{ border: '1px solid white', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map(column => {
                                const { key, ...columnProps } = column.getHeaderProps(column.getSortByToggleProps());
                                return (
                                    <th key={key} {...columnProps} style={{ border: '1px solid white', position: 'relative' }}>
                                        {column.render('Header')}
                                        {column.canFilter ? column.render('Filter') : null}
                                        <span>
                                            {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                                        </span>
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {rows.map(row => {
                        prepareRow(row);
                        return (
                            <tr {...row.getRowProps()} key={row.id}>
                                {row.cells.map(cell => {
                                    const { key, ...cellProps } = cell.getCellProps();
                                    return (
                                        <td {...cellProps} key={key} style={{ border: '1px solid white' }}>
                                            {cell.render('Cell')}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default PlaysTable;