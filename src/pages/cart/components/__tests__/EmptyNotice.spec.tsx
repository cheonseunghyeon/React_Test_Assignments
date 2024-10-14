import { screen } from '@testing-library/react';

import customRender from '@/utils/test/render';
import { EmptyNotice } from '../EmptyNotice';
import userEvent from '@testing-library/user-event';

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...require('react-router-dom'),
  useNavigate: () => mockedNavigate, // 모킹된 navigate 함수 반환
}));

it('"홈으로 가기" 링크를 클릭할 경우 "/" 경로로 navigate 함수가 호출된다', async () => {
  // Arrange: EmptyNotice 컴포넌트를 렌더링
  const { user } = await customRender(<EmptyNotice />);

  // Act: "홈으로 가기" 텍스트를 가진 요소를 클릭
  const link = screen.getByText('홈으로 가기');
  await userEvent.click(link);
  // Assert: navigate 함수가 '/' 경로로 호출되었는지 확인
  expect(mockedNavigate).toHaveBeenCalledWith('/');
});
