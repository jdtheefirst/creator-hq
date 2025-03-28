-- Create products table
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price decimal(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  category text not null,
  image_url text,
  status text default 'draft' check (status in ('draft', 'active', 'out_of_stock', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  creator_id uuid references auth.users(id) on delete cascade,
  sales_count integer default 0,
  rating decimal(3,2) default 0,
  review_count integer default 0
);

-- Create index for faster queries
create index products_creator_id_idx on products(creator_id);
create index products_status_idx on products(status);
create index products_category_idx on products(category);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_products_updated_at
  before update on products
  for each row
  execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table products enable row level security;

-- Create policies
create policy "Public can view active products"
  on products for select
  using (status = 'active');

create policy "Creators can view their own products"
  on products for select
  using (auth.uid() = creator_id);

create policy "Creators can insert their own products"
  on products for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their own products"
  on products for update
  using (auth.uid() = creator_id);

create policy "Creators can delete their own products"
  on products for delete
  using (auth.uid() = creator_id);

-- Create function to update product status based on stock
create or replace function update_product_status()
returns trigger as $$
begin
  if new.stock = 0 then
    new.status := 'out_of_stock';
  elsif new.status = 'out_of_stock' and new.stock > 0 then
    new.status := 'active';
  end if;
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update product status
create trigger update_product_status_trigger
  before update of stock on products
  for each row
  execute function update_product_status(); 