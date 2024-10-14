import { PRODUCT_PAGE_SIZE } from '@/constants';
import { IProduct, useFetchProducts } from '@/lib/product';
import { formatPrice } from '@/utils/formatter';
import {
  mockUseAuthStore,
  mockUseCartStore,
  mockUseToastStore,
} from '@/utils/test/mockZustandStore';
import render from '@/utils/test/render';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mock, vi } from 'vitest';
import { ProductList } from '../ProductList';

interface CreateMockDataParams {
  products?: IProduct[];
  hasNextPage?: boolean;
  totalCount?: number;
  nextPage?: number | undefined;
  fetchNextPageFn?: Mock<any>;
}

const mockedNavigate = vi.fn(); // 모킹된 navigate 함수
vi.mock('react-router-dom', () => ({
  ...require('react-router-dom'), // 기존 react-router-dom 모듈 유지
  useNavigate: () => mockedNavigate, // useNavigate 모킹
}));

const createMockData = ({
  products = [],
  hasNextPage = false,
  totalCount = products.length,
  nextPage = undefined,
  fetchNextPageFn = vi.fn(),
}: CreateMockDataParams = {}) => ({
  pages: [
    {
      products,
      hasNextPage,
      totalCount,
      nextPage,
    },
  ],
  pageParams: [undefined],
});

const mockProducts: IProduct[] = [
  {
    id: '1',
    title: 'Product 1',
    price: 1000,
    category: { id: '1', name: 'category1' },
    image: 'image_url_1',
  },
  {
    id: '2',
    title: 'Product 2',
    price: 2000,
    category: { id: '2', name: 'category2' },
    image: 'image_url_2',
  },
];

describe('ProductList Component', () => {
  it('로딩이 완료된 경우 상품 리스트가 제대로 모두 노출된다', async () => {
    const mockData = createMockData({ products: mockProducts });

    (useFetchProducts as jest.Mock).mockReturnValue({
      data: mockData,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });

    render(<ProductList />);

    const product1 = screen.getByText('Product 1');
    const product2 = screen.getByText('Product 2');
    expect(product1).toBeInTheDocument();
    expect(product2).toBeInTheDocument();
  });

  it('보여줄 상품 리스트가 더 있는 경우 "더 보기" 버튼이 노출되며, 버튼을 누르면 상품 리스트를 더 가져온다.', async () => {
    const fetchNextPageFn = vi.fn();

    const mockData = createMockData({
      products: mockProducts,
      hasNextPage: true,
      totalCount: 4,
      nextPage: 2,
      fetchNextPageFn,
    });

    (useFetchProducts as jest.Mock).mockReturnValue({
      data: mockData,
      fetchNextPage: fetchNextPageFn,
      hasNextPage: true,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });

    render(<ProductList />);
    const loadMoreButton = screen.getByText('더 보기');
    expect(loadMoreButton).toBeInTheDocument();

    await userEvent.click(loadMoreButton);
    expect(fetchNextPageFn).toHaveBeenCalled();
  });

  it('보여줄 상품 리스트가 없는 경우 "더 보기" 버튼이 노출되지 않는다.', async () => {
    const mockData = createMockData({ products: [] });

    (useFetchProducts as jest.Mock).mockReturnValue({
      data: mockData,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      error: null,
    });

    render(<ProductList />);

    const loadMoreButton = screen.queryByText('더 보기');
    expect(loadMoreButton).not.toBeInTheDocument();
  });

  describe('로그인 상태일 경우', () => {
    beforeEach(() => {
      mockUseAuthStore({
        user: {
          uid: 'user123',
          email: 'test@example.com',
          displayName: '홍길동',
        },
      });
    });

    it('구매 버튼 클릭시 addCartItem 메서드가 호출되며, "/cart" 경로로 navigate 함수가 호출된다.', async () => {
      const addCartItem = vi.fn();

      mockUseCartStore({ addCartItem });

      render(<ProductList />);
      const buyButton = screen.getByText('구매');
      await userEvent.click(buyButton);

      expect(addCartItem).toHaveBeenCalled();
      expect(mockedNavigate).toHaveBeenCalledWith('/cart');
    });

    it('장바구니 버튼 클릭시 "장바구니 추가 완료!" toast를 노출하며, addCartItem 메서드가 호출된다.', async () => {
      const addToast = vi.fn();
      const addCartItem = vi.fn();

      mockUseToastStore({ addToast });
      mockUseCartStore({ addCartItem });

      render(<ProductList />);
      const cartButton = await screen.findByText('장바구니');
      await userEvent.click(cartButton);

      expect(addCartItem).toHaveBeenCalled();
      expect(addToast).toHaveBeenCalledWith('장바구니 추가 완료!', 'success');
    });
  });

  describe('로그인이 되어 있지 않은 경우', () => {
    beforeEach(() => {
      mockUseAuthStore({ user: null });
    });

    it('구매 버튼 클릭시 "/login" 경로로 navigate 함수가 호출된다.', async () => {
      render(<ProductList />);
      const buyButton = screen.getByText('구매');
      await userEvent.click(buyButton);

      expect(mockedNavigate).toHaveBeenCalledWith('/login');
    });

    it('장바구니 버튼 클릭시 "/login" 경로로 navigate 함수가 호출된다.', async () => {
      render(<ProductList />);
      const cartButton = await screen.findByText(/장바구니/i);
      await userEvent.click(cartButton);

      expect(mockedNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
