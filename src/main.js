/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчёт прибыли от операции
    // purchase — это одна из записей в поле items из чека в data.purchase_records
    // _product — это продукт из коллекции data.products

    // const {discount,sale_price,quantity} = purchase;
    const discount = 1 - (purchase.discount / 100);
    return purchase.sale_price * purchase.quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчёт бонуса от позиции в рейтинге
    const {
        profit
    } = seller;

    if (index === 0) {
        return 150;
    } else if (index === 1 || index === 2) {
        return 100;
    } else if (index === total - 1) {
        return 0;
    } else {
        return 50;
    }


}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
    // Здесь проверим входящие данные
    // @TODO: Проверка входных данных
    if (!data ||
        !Array.isArray(data.sellers) ||
        data.sellers.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }
    // @TODO: Проверка наличия опций
    const {
        calculateRevenue,
        calculateBonus
    } = options;

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {},
        bonus: 0,
        top_products: []
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = sellerStats.reduce((result, item) => ({
        ...result,
        [item.id]: item
    }), {}); // Ключом будет id, значением — запись из sellerStats

    const productIndex = data.products.reduce((result, item) => ({
        ...result,
        [item.sku]: item
    }), {}); // Ключом будет sku, значением — запись из data.products

    data.purchase_records.forEach(record => { // Чек forEach - означает перебрать все записи о продажах
        const seller = sellerIndex[record.seller_id]; // Продавец. Обновили статистики в объекте для каждого продавца
        // Увеличить количество продаж
        seller.sales_count += 1;
        // Увеличить общую сумму всех продаж
        seller.revenue += record.total_amount;
        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * item.quantity;
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenueFromItem = calculateSimpleRevenue({
                    sale_price: item.sale_price,
                    quantity: item.quantity,
                    discount: item.discount || 0
                },
                product
            );
            // Посчитать прибыль: выручка минус себестоимость
            const profitFromItem = revenueFromItem - cost;
            // Увеличить общую накопленную прибыль (profit) у продавца
            seller.profit += profitFromItem;
            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    const sortedSellers = [...sellerStats].sort((a, b) => b.profit - a.profit);

    const totalSellers = sortedSellers.length;

    // @TODO: Назначение премий на основе ранжирования
    sortedSellers.forEach((seller, index) => {
        // Расчет бонуса по рангу
        seller.bonus = seller.profit * (calculateBonusByProfit(index, totalSellers, seller)/ 1000);

        // Формируем топ-10 товаров по количеству проданных единиц
        const topProductsArray = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({
                sku,
                quantity
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        seller.top_products = topProductsArray;
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sortedSellers.map(seller => {
        const originalSeller = data.sellers.find(s => s.id === seller.id);
        return {
            seller_id: seller.id,
            name: `${originalSeller.first_name} ${originalSeller.last_name}`,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            sales_count: seller.sales_count,
            top_products: seller.top_products,
            bonus: +seller.bonus.toFixed(2)
        };
    });
}
